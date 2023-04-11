import { useEffect, useState } from "react";
import { parse, ParseResult } from "papaparse";

const extraPointMap = {
  roads: 2,
  merchant: 1,
};

type ExtraPointItem =
  | "merchant"
  | "roads"
  | "defender"
  | "victoryPolitics"
  | "victoryScience"
  | "metropolisTrade"
  | "metropolisPolitics"
  | "metropolisScience";

type ExtraPoints = {
  total: number;
  items: Partial<Record<ExtraPointItem, number>>;
};

export type GamePlayerData = {
  name: string;
  score: number;
  base?: ReturnType<typeof parseBase>;
  development?: ReturnType<typeof parseDevelopment>;
  extraPoints?: ReturnType<typeof parseExtraPoints>;
  order?: number;
};

export type GameData = {
  gameNo: string;
  date: string;
  players: GamePlayerData[];
};

function handleUnrecognizedInput(input: string) {
  alert(`Unrecognized field "${input}"`);

  return new Error(`Bad field: ${input}`);
}

function parseBase(baseString: string) {
  const cities = Number(/(\d+)c/.exec(baseString)?.[1]) || 0;
  const settlements = Number(/(\d+)s/.exec(baseString)?.[1]) || 0;

  return { cities, settlements };
}

function parseDevelopment(baseString: string) {
  const trade = Number(/(\d+)y/.exec(baseString)?.[1]) || 0;
  const politics = Number(/(\d+)b/.exec(baseString)?.[1]) || 0;
  const science = Number(/(\d+)g/.exec(baseString)?.[1]) || 0;

  return { trade, politics, science };
}

function getExtraPointData(name: string): {
  score: number;
  name: ExtraPointItem;
} {
  const defenderPoints = /^(\d)+d/.exec(name);
  if (defenderPoints) return { score: +defenderPoints[1], name: "defender" };

  switch (name) {
    case "my":
      return { score: 2, name: "metropolisTrade" };
    case "mb":
      return { score: 2, name: "metropolisPolitics" };
    case "mg":
      return { score: 2, name: "metropolisScience" };
    case "vb":
      return { score: 1, name: "victoryPolitics" };
    case "vg":
      return { score: 1, name: "victoryScience" };
    default: {
      if (name !== "roads" && name !== "merchant")
        throw handleUnrecognizedInput(name);

      const score = extraPointMap[name];

      if (!score) throw handleUnrecognizedInput(name);

      return {
        name,
        score,
      };
    }
  }
}

function parseExtraPoints(baseString: string) {
  return baseString.split(", ").reduce(
    (acc: ExtraPoints, item) => {
      if (!item) return acc;

      const { name, score } = getExtraPointData(item);
      acc.total += score;
      acc.items[name] = acc.items[name] || 0 + score;

      return acc;
    },
    { total: 0, items: {} }
  );
}
function handlePlayerField(
  fieldName: string,
  values: string[],
  playerData: any[]
) {
  switch (fieldName) {
    case "Player":
      return values
        .filter((name) => !!name)
        .map((name) => ({ name: name.trim() }));
    case "Score":
      return playerData.map((data, i) => ({ ...data, score: +values[i] }));
    case "Base":
      return playerData.map((data, i) => ({
        ...data,
        base: parseBase(values[i]),
      }));
    case "Development":
      return playerData.map((data, i) => ({
        ...data,
        development: parseDevelopment(values[i]),
      }));
    case "Extra points":
      return playerData.map((data, i) => ({
        ...data,
        extraPoints: parseExtraPoints(values[i]),
      }));
    case "Start order":
      return playerData.map((data, i) => ({ ...data, order: +values[i] }));
    default:
      throw handleUnrecognizedInput(`${fieldName}:${values.join(", ")}`);
  }
}

export const useCsvParser = (fileUrl: string) => {
  const [parsedData, setParsedData] = useState<GameData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = window.origin + "/api/data?file=";

    if (!fileUrl) return;

    async function parseFileFromUrl() {
      setIsLoading(true);
      try {
        const response = await new Promise<ParseResult<string[]>>(
          (resolve, reject) =>
            parse(baseUrl + fileUrl, {
              download: true,
              worker: true,
              complete: resolve,
              error: reject,
            })
        );

        // Skip first 2 rows with meta data
        const dataRows = response.data.slice(2);

        const { data } = dataRows.reduce(
          (
            acc: { currentGame: GameData | null; data: GameData[] },
            row: string[],
            index: number
          ) => {
            const [gameNo, date, field, ...players] = row.slice(0, 7);
            if (gameNo) {
              if (acc.currentGame) acc.data.push(acc.currentGame);

              acc.currentGame = {
                gameNo,
                date,
                players: [],
              };
            }

            if (!acc.currentGame) throw handleUnrecognizedInput(row.join(", "));

            acc.currentGame.players = handlePlayerField(
              field,
              players,
              acc.currentGame.players
            );
            if (index === dataRows.length - 1) acc.data.push(acc.currentGame);

            return acc;
          },
          { currentGame: null, data: [] }
        );
        setParsedData(data);
      } catch (error) {
        if (error instanceof Error) setError(error.toString());
        else setError("Unhandled error");
      }
      setIsLoading(false);
    }

    parseFileFromUrl();
  }, [fileUrl]);

  const invalidScores = parsedData
    ?.map(({ players, gameNo }) =>
      players.map((player) => {
        if (!player.extraPoints && !player.base) return {};

        const extrapointScore = player.extraPoints?.total || 0;
        const baseScore =
          (player.base?.cities || 0) * 2 + (player.base?.settlements || 0);
        const expectedScore = extrapointScore + baseScore;

        return {
          gameNo,
          name: player.name,
          score: player.score,
          development: player.development,
          expectedScore: expectedScore,
        };
      })
    )
    .filter((players) =>
      players.some(({ expectedScore, score }) => score !== expectedScore)
    );
  console.log("scores", invalidScores);
  return { data: parsedData, isLoading, error };
};
