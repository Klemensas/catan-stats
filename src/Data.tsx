import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Tooltip,
  Chip,
  TextField,
  Box,
  Grid,
  Paper,
  Container,
  FormControlLabel,
  Switch,
  colors,
} from "@material-ui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDice,
  faLaugh,
  faSmile,
  faMeh,
  faFrown,
  faSadCry,
  faClock,
  faUsers,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { format, formatDistanceToNow } from "date-fns";
import {
  DateRangePicker,
  DateRange,
  DateRangeDelimiter,
} from "@material-ui/pickers";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

import { GameData, GamePlayerData } from "./useCsvParser";
import PlayerProfile from "./PlayerProfile";

const gameRecency = [
  { maxTime: 1209600000, color: "#0f9960", icon: faLaugh },
  { maxTime: 2592000000, color: "#2d5f4a", icon: faSmile },
  { maxTime: 5184000000, color: "inherit", icon: faMeh },
  { maxTime: 10368000000, color: "#692626", icon: faFrown },
  { color: "#b10101", icon: faSadCry },
];

const placeNames = ["first", "second", "third", "fourth"] as const;

export type PlayerData = {
  name: string;
  totalGames: number;
  totalScore: number;
  totalWins: number;
  places: {
    first: number;
    second: number;
    third: number;
    fourth: number;
  };
  games: GameData[];
};

function playersWithOrder(
  players: GamePlayerData[]
): players is Array<GamePlayerData & { order: number }> {
  return players[0].order !== undefined;
}

type Ranks = {
  first: number;
  second: number;
  third: number;
  fourth: number;
};

function Data({ data }: { data: GameData[] }) {
  const lastGame = data[data.length - 1];
  const firstGame = data[0];

  const lastGameDate = new Date(lastGame.date);
  const firstGameDate = new Date(firstGame.date);

  const timePastSinceLastGame = Date.now() - +lastGameDate;
  const gameRecencyItem = gameRecency.find(
    (stage) => !stage.maxTime || timePastSinceLastGame < stage.maxTime
  );

  const [displayRange, setDisplayRange] = useState<DateRange<Date>>([
    firstGameDate,
    lastGameDate,
  ]);
  const allPlayers = [
    ...new Set(data.flatMap((game) => game.players.map(({ name }) => name))),
  ];

  const [blacklistedPlayers, setBlacklistedPlayers] = useState<string[]>([]);
  const [requiredGameStats, setRequiredGameStats] = useState<
    Array<"order" | "point-details">
  >([]);

  const dateFilteredGames = data.filter(
    ({ date }) =>
      displayRange[0] &&
      displayRange[1] &&
      displayRange[0] <= new Date(date) &&
      displayRange[1] >= new Date(date)
  );

  const playerFilteredGames = dateFilteredGames.filter(
    ({ players }) =>
      !players.some(({ name }) => blacklistedPlayers.includes(name))
  );

  const gamesMissingStats = playerFilteredGames
    .filter(({ players: [{ base, development, extraPoints, order }] }) =>
      [base, development, extraPoints, order].includes(undefined)
    )
    .map(({ gameNo, players: [{ base, development, extraPoints, order }] }) => {
      const missingFields = [];

      if (!base) missingFields.push("base");
      if (!development) missingFields.push("development");
      if (!extraPoints) missingFields.push("extraPoints");
      if (order === undefined) missingFields.push("order");

      return {
        gameNo,
        missingFields,
      };
    });

  const filteredGames = !requiredGameStats.length
    ? playerFilteredGames
    : playerFilteredGames.filter(
        (game) =>
          !gamesMissingStats.find(({ gameNo, missingFields }) => {
            if (gameNo !== game.gameNo) return false;

            if (
              requiredGameStats.includes("order") &&
              missingFields.includes("order")
            )
              return true;

            if (
              requiredGameStats.includes("point-details") &&
              missingFields.some((field) => field !== "order")
            )
              return true;

            return false;
          })
      );

  const shownGamesMissingStats = gamesMissingStats.filter(({ gameNo }) =>
    filteredGames.find((game) => game.gameNo === gameNo)
  );

  const dateAvailablePlayers = [
    ...new Set(
      dateFilteredGames.flatMap((game) => game.players.map(({ name }) => name))
    ),
  ];
  const players = filteredGames.reduce(
    (acc: Record<string, PlayerData>, game) => {
      game.players.forEach((player, index) => {
        const place = index + 1;
        const playerData = acc[player.name] || {
          name: player.name,
          totalGames: 0,
          totalScore: 0,
          totalWins: 0,
          places: {
            first: 0,
            second: 0,
            third: 0,
            fourth: 0,
          },
          games: [],
        };
        playerData.totalScore += player.score;
        playerData.totalGames++;
        playerData.totalWins += place === 1 ? 1 : 0;
        playerData.games.push(game);

        const placeName = placeNames[index];
        playerData.places[placeName] += 1;

        acc[player.name] = playerData;
      });

      return acc;
    },
    {}
  );

  useEffect(() => {
    const minGames = data.length * 0.2;
    const playersBelowMinGameCount = Object.values(players)
      .filter(({ totalGames }) => totalGames < minGames)
      .map(({ name }) => name);

    if (playersBelowMinGameCount)
      setBlacklistedPlayers(playersBelowMinGameCount);
  }, []);

  const victoriesByOrder = filteredGames.reduce(
    (
      acc: Partial<
        Record<
          typeof placeNames[number],
          Partial<Record<typeof placeNames[number], number>>
        >
      >,
      { players }
    ) => {
      if (!playersWithOrder(players)) return acc;

      const order = players.map(({ order }) => order);
      order.forEach((order, index) => {
        const orderPositionName = placeNames[order - 1];
        const position = placeNames[index];
        const orderPositions = acc[orderPositionName] || {};

        orderPositions[position] = (orderPositions[position] || 0) + 1;
        acc[orderPositionName] = orderPositions;
      });

      return acc;
    },
    {}
  );

  return (
    <Container>
      <Box my={4}>
        <Grid container spacing={3}>
          <Grid item xs>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4">
                  <FontAwesomeIcon icon={faDice} />
                  &nbsp;Total games
                </Typography>
                <Typography variant="h3">{data.length}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {gameRecencyItem && (
            <Grid item xs>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h4">
                    <FontAwesomeIcon icon={faClock} />
                    &nbsp;Last played
                  </Typography>
                  <Typography variant="h3">
                    <Tooltip
                      title={format(lastGameDate, "do MMMM yyyy")}
                      placement="top"
                    >
                      <span style={{ color: gameRecencyItem.color }}>
                        {formatDistanceToNow(lastGameDate, { addSuffix: true })}
                        &nbsp;
                        <FontAwesomeIcon icon={gameRecencyItem.icon} />
                      </span>
                    </Tooltip>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4">
                  <FontAwesomeIcon icon={faUsers} />
                  &nbsp;Total players
                </Typography>
                <Typography variant="h3">{allPlayers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box
        py={2}
        px={2}
        mx={-2}
        position="sticky"
        top={0}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        zIndex={1}
        style={{ backgroundColor: "white" }}
      >
        <Box>
          <DateRangePicker
            startText="Start date"
            endText="End date"
            label={null}
            value={displayRange}
            disableFuture
            disableHighlightToday
            reduceAnimations
            minDate={firstGameDate}
            maxDate={lastGameDate}
            onChange={setDisplayRange}
            renderInput={(startProps, endProps) => (
              <React.Fragment>
                <TextField {...startProps} size="small" helperText={null} />
                <DateRangeDelimiter> to </DateRangeDelimiter>
                <TextField {...endProps} size="small" helperText={null} />
              </React.Fragment>
            )}
          />
        </Box>
        {!!gamesMissingStats.length && (
          <Box display="flex" flex="1" px={2} alignItems="center">
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={!requiredGameStats.includes("order")}
                    onChange={() =>
                      setRequiredGameStats((requiredStats) =>
                        requiredStats.includes("order")
                          ? requiredStats.filter((stat) => stat !== "order")
                          : [...requiredStats, "order"]
                      )
                    }
                    color="primary"
                  />
                }
                label="Games missing start order"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={!requiredGameStats.includes("point-details")}
                    onChange={() =>
                      setRequiredGameStats((requiredStats) =>
                        requiredStats.includes("point-details")
                          ? requiredStats.filter(
                              (stat) => stat !== "point-details"
                            )
                          : [...requiredStats, "point-details"]
                      )
                    }
                    color="primary"
                  />
                }
                label="Games missing point details"
              />
            </Box>
            <Tooltip
              title={shownGamesMissingStats.map(({ gameNo, missingFields }) => {
                return (
                  <Box>
                    Game #{gameNo} is missing - {missingFields.join(", ")} data
                  </Box>
                );
              })}
              placement="top"
            >
              <Box
                pl={3}
                component="span"
                visibility={
                  !!shownGamesMissingStats.length ? "visible" : "hidden"
                }
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  size="lg"
                  color={colors.deepOrange[500]}
                />
              </Box>
            </Tooltip>
          </Box>
        )}
        <Box>
          {dateAvailablePlayers.map((name) => {
            const isBlacklisted = blacklistedPlayers.includes(name);

            return (
              <Chip
                style={{ margin: 2 }}
                key={name}
                label={name}
                variant={isBlacklisted ? "outlined" : undefined}
                color={isBlacklisted ? undefined : "primary"}
                onClick={() =>
                  setBlacklistedPlayers(
                    isBlacklisted
                      ? blacklistedPlayers.filter((player) => player !== name)
                      : [...blacklistedPlayers, name]
                  )
                }
              />
            );
          })}
        </Box>
      </Box>
      <Box my={4}>
        <Box mb={2}>
          <Typography variant="h4">Shown player data</Typography>
        </Box>
        <Grid container spacing={3}>
          {Object.values(players).map((player) => (
            <Grid item sm={4}>
              <PlayerProfile
                key={player.name}
                player={player}
                playerGames={player.games}
              />
            </Grid>
          ))}
        </Grid>
        {/* <PlayerProfile playerGames={filteredGames} /> */}
      </Box>
      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} style={{ maxHeight: "80vh", height: 500 }}>
            <Typography variant="h4">1st place percentage over time</Typography>
            <ResponsiveLine
              data={Object.values(players).map((player) => {
                const playerGames = filteredGames.filter((game) =>
                  game.players.some(({ name }) => name === player.name)
                );

                return {
                  id: player.name,
                  data: playerGames.reduce(
                    (acc: { x: string; y: number }[], game, i) => {
                      const playerPosition = game.players.findIndex(
                        ({ name }) => name === player.name
                      );
                      const hasWon = playerPosition === 0;
                      const previousAvg = acc[acc.length - 1]?.y || 0;
                      const newAvg =
                        (previousAvg * acc.length + +hasWon) / (i + 1);

                      acc.push({
                        x: game.gameNo,
                        y: newAvg,
                      });
                      return acc;
                    },
                    []
                  ),
                };
              })}
              margin={{ top: 50, right: 60, bottom: 120, left: 60 }}
              colors={{ scheme: "category10" }}
              curve="natural"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                orient: "bottom",
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Game",
                legendOffset: 40,
                legendPosition: "middle",
              }}
              lineWidth={4}
              pointSize={12}
              pointBorderWidth={2}
              useMesh
              enableCrosshair={false}
              yFormat={(value) => `${Math.round(+value * 10000) / 100}%`}
              tooltip={(item) => {
                // Read from formatted data
                const gameData = data.find(
                  ({ gameNo }) => gameNo === String(item.point.data.x)
                );
                if (!gameData) return <div>Missing game data</div>;

                return (
                  <Paper>
                    <Box p={1} alignContent="left">
                      <div>{gameData.date}</div>
                      {gameData.players.map((player) => (
                        <div>
                          {player.name}: {player.score}
                        </div>
                      ))}
                    </Box>
                  </Paper>
                );
              }}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  translateY: 80,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  symbolSize: 18,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                      },
                    },
                  ],
                },
              ]}
            />
          </Grid>
          <Grid item xs={6} style={{ height: 300 }}>
            <Typography variant="h4">1st place percentage</Typography>
            <ResponsivePie
              data={Object.values(players).map((player) => ({
                id: player.name,
                label: player.name,
                value: player.totalWins / player.totalGames,
              }))}
              sliceLabel={({ value }) => `${Math.round(value * 10000) / 100}%`}
              colors={{ scheme: "category10" }}
              innerRadius={0.4}
              padAngle={2}
              radialLabelsLinkColor={{ from: "color", modifiers: [] }}
              radialLabelsLinkStrokeWidth={4}
              radialLabelsLinkOffset={4}
              slicesLabelsSkipAngle={2}
              radialLabelsSkipAngle={1}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              tooltip={(slice) => (
                <>
                  <p>Games played: {players[slice.id].totalGames}</p>
                  <p>Total wins: {players[slice.id].totalWins}</p>
                </>
              )}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  translateY: 56,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  symbolSize: 18,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                      },
                    },
                  ],
                },
              ]}
            />
          </Grid>
          <Grid item xs={6} style={{ height: 300 }}>
            <Typography variant="h4">Place percentage</Typography>
            <ResponsiveBar
              data={Object.values(players).map(
                ({ name, places, totalGames }) => ({
                  name,
                  first: places.first / totalGames,
                  second: places.second / totalGames,
                  third: places.third / totalGames,
                  fourth: places.fourth / totalGames,
                })
              )}
              label={({ value }) => {
                if (typeof value !== "number") return "";

                return `${Math.round(value * 10000) / 100}%`;
              }}
              keys={placeNames as any}
              indexBy="name"
              margin={{ top: 10, right: 60, bottom: 80, left: 60 }}
              colors={{ scheme: "category10" }}
              legends={[
                {
                  dataFrom: "keys",
                  anchor: "bottom",
                  direction: "row",
                  justify: false,
                  translateY: 60,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: "left-to-right",
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]}
              animate={true}
              motionStiffness={90}
              motionDamping={15}
            />
          </Grid>

          <Grid item xs={12} style={{ maxHeight: "80vh", height: 500 }}>
            <Typography variant="h4">Average score over time</Typography>
            <ResponsiveLine
              data={Object.values(players).map((player) => {
                const playerGames = filteredGames.filter((game) =>
                  game.players.some(({ name }) => name === player.name)
                );

                return {
                  id: player.name,
                  data: playerGames.reduce(
                    (acc: { x: string; y: number }[], game, i) => {
                      const playerScore =
                        game.players.find(({ name }) => name === player.name)
                          ?.score || 0;
                      const previousAvg = acc[acc.length - 1]?.y || 0;
                      const newAvg =
                        (previousAvg * acc.length + playerScore) / (i + 1);

                      acc.push({
                        x: game.gameNo,
                        y: newAvg,
                      });
                      return acc;
                    },
                    []
                  ),
                };
              })}
              margin={{ top: 50, right: 60, bottom: 120, left: 60 }}
              colors={{ scheme: "category10" }}
              curve="natural"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                orient: "bottom",
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Game",
                legendOffset: 40,
                legendPosition: "middle",
              }}
              lineWidth={4}
              pointSize={12}
              pointBorderWidth={2}
              useMesh
              enableCrosshair={false}
              yScale={{
                type: "linear",
                max: "auto",
                min: "auto",
              }}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  translateY: 80,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  symbolSize: 18,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                      },
                    },
                  ],
                },
              ]}
            />
          </Grid>
        </Grid>

        {/* <Grid item xs={6} style={{ height: 300 }}>
          <Typography variant="h4">Order victory percentage</Typography>
          <ResponsiveBar
            data={Object.values(victoriesByOrder).map((ranks, index) => {
              const totalGames = Object.values(ranks).reduce(
                (acc, gameCount) => acc + gameCount
              );
              return {
                name: placeNames[index],
                first: places.first / totalGames,
                second: places.second / totalGames,
                third: places.third / totalGames,
                fourth: places.fourth / totalGames,
              };
            })}
            label={({ value }) => {
              if (typeof value !== "number") return "";

              return `${Math.round(value * 10000) / 100}%`;
            }}
            keys={placeNames as any}
            indexBy="name"
            margin={{ top: 10, right: 60, bottom: 80, left: 60 }}
            colors={{ scheme: "category10" }}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateY: 60,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
          />
        </Grid> */}
      </Box>
    </Container>
  );
}

export default Data;
