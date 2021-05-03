import { faDice } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Card, CardContent, Typography, Tooltip } from "@material-ui/core";
import React, { useState } from "react";

import { PlayerData } from "./Data";
import { GameData } from "./useCsvParser";

const getGameStats = (games: GameData[], targetPlayer?: string) =>
  games.reduce(
    (acc, game) => {
      const playerPosition = targetPlayer
        ? game.players.findIndex(({ name }) => name === targetPlayer)
        : 0;
      const playerData = game.players[playerPosition];

      acc.development.trade += playerData.development?.trade ?? 0;
      acc.development.politics += playerData.development?.politics ?? 0;
      acc.development.science += playerData.development?.science ?? 0;

      acc.base.cities += playerData.base?.cities ?? 0;
      acc.base.settlements += playerData.base?.settlements ?? 0;

      acc.extra.roads += (playerData.extraPoints?.items.roads ?? 0) / 2;
      acc.extra.merchant += playerData.extraPoints?.items.merchant ?? 0;
      acc.extra.defender += playerData.extraPoints?.items.defender ?? 0;
      acc.extra.victoryPolitics +=
        playerData.extraPoints?.items.victoryPolitics ?? 0;
      acc.extra.victoryScience +=
        playerData.extraPoints?.items.victoryScience ?? 0;
      acc.extra.metropolisTrade +=
        (playerData.extraPoints?.items.metropolisTrade ?? 0) / 2;
      acc.extra.metropolisPolitics +=
        (playerData.extraPoints?.items.metropolisPolitics ?? 0) / 2;
      acc.extra.metropolisScience +=
        (playerData.extraPoints?.items.metropolisScience ?? 0) / 2;

      if (typeof playerData.order === "number") {
        acc.order[playerData.order - 1]++;
      }

      return acc;
    },
    {
      development: {
        trade: 0,
        politics: 0,
        science: 0,
      },
      base: {
        cities: 0,
        settlements: 0,
      },
      extra: {
        merchant: 0,
        roads: 0,
        defender: 0,
        victoryPolitics: 0,
        victoryScience: 0,
        metropolisTrade: 0,
        metropolisPolitics: 0,
        metropolisScience: 0,
      },
      order: [0, 0, 0, 0],
    }
  );
function PlayerProfile({
  player,
  playerGames,
}: {
  player?: PlayerData;
  playerGames: GameData[];
}) {
  const games = playerGames.filter(
    ({ players }) => !!players[0].base && !!players[0].development
  );
  const wonGames = games.filter(
    ({ players }) => players[0].name === player?.name
  );

  const gameStats = getGameStats(games, player?.name);
  const winStats = getGameStats(wonGames, player?.name);

  const playerAverages = {
    development: {
      trade: gameStats.development.trade / games.length,
      science: gameStats.development.science / games.length,
      politics: gameStats.development.politics / games.length,
    },
    base: {
      cities: gameStats.base.cities / games.length,
      settlements: gameStats.base.settlements / games.length,
    },
    extra: {
      merchant: gameStats.extra.merchant / games.length,
      roads: gameStats.extra.roads / games.length,
      defender: gameStats.extra.defender / games.length,
      victoryPolitics: gameStats.extra.victoryPolitics / games.length,
      victoryScience: gameStats.extra.victoryScience / games.length,
      metropolisTrade: gameStats.extra.metropolisTrade / games.length,
      metropolisPolitics: gameStats.extra.metropolisPolitics / games.length,
      metropolisScience: gameStats.extra.metropolisScience / games.length,
    },
    // winStats: {
    //   order: playerStats.winStats.order.reduce(
    //     (acc: null | { order: number; wins: number }, wins, i) =>
    //       wins > (acc?.wins || 0) ? { order: i + 1, wins } : acc,
    //     null
    //   ),
    //   development: {
    //     trade:
    //       playerStats.winStats.development.trade /
    //       playerStats.winStats.gameCount,
    //     science:
    //       playerStats.winStats.development.science /
    //       playerStats.winStats.gameCount,
    //     politics:
    //       playerStats.winStats.development.politics /
    //       playerStats.winStats.gameCount,
    //   },
    //   base: {
    //     cities:
    //       playerStats.winStats.base.cities / playerStats.winStats.gameCount,
    //     settlements:
    //       playerStats.winStats.base.settlements /
    //       playerStats.winStats.gameCount,
    //   },
    // },
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">{player?.name || "General"}</Typography>
          <Typography variant="h6">
            <FontAwesomeIcon icon={faDice} />
            <Box component="span" ml={1}>
              {player?.games.length}
            </Box>
          </Typography>
        </Box>

        <Box mb={2}>
          <Tooltip
            placement="top-start"
            title="Average commodity level reached per game"
          >
            <Typography align="left" variant="subtitle1">
              Commodities
            </Typography>
          </Tooltip>
          <Box display="flex" justifyContent="space-between">
            <Box flex="1">
              <Typography variant="caption">Science</Typography>
              <Typography variant="subtitle2">
                {playerAverages.development.science.toFixed(2)}
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Trade</Typography>
              <Typography variant="subtitle2">
                {playerAverages.development.trade.toFixed(2)}
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Politics</Typography>
              <Typography variant="subtitle2">
                {playerAverages.development.politics.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box mb={2}>
          <Tooltip
            placement="top-start"
            title="Percentage of games where finished with the metropoly"
          >
            <Typography align="left" variant="subtitle1">
              Metropolies
            </Typography>
          </Tooltip>
          <Box display="flex" justifyContent="space-between">
            <Box flex="1">
              <Typography variant="caption">Science</Typography>
              <Typography variant="subtitle2">
                {(playerAverages.extra.metropolisScience * 100).toFixed(2)}%
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Trade</Typography>
              <Typography variant="subtitle2">
                {(playerAverages.extra.metropolisTrade * 100).toFixed(2)}%
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Politics</Typography>
              <Typography variant="subtitle2">
                {(playerAverages.extra.metropolisPolitics * 100).toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box mb={2}>
          <Tooltip
            placement="top-start"
            title="Average count of buildings per game"
          >
            <Typography align="left" variant="subtitle1">
              Buildings
            </Typography>
          </Tooltip>
          <Box display="flex" justifyContent="space-between">
            <Box flex="1">
              <Typography variant="caption">Settlements</Typography>
              <Typography variant="subtitle2">
                {playerAverages.base.settlements.toFixed(2)}
              </Typography>
            </Box>
            <Box flex="1" />
            <Box flex="1">
              <Typography variant="caption">Cities</Typography>
              <Typography variant="subtitle2">
                {playerAverages.base.cities.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box mb={2}>
          <Tooltip
            placement="top-start"
            title="Percentage of games where owned the corresponding item. Except for defender, which represents average owned card count per game"
          >
            <Typography align="left" variant="subtitle1">
              Extra
            </Typography>
          </Tooltip>
          <Box display="flex" justifyContent="space-between">
            <Box flex="1">
              <Typography variant="caption">Roads</Typography>
              <Typography variant="subtitle2">
                {(playerAverages.extra.roads * 100).toFixed(2)}%
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Merchant</Typography>
              <Typography variant="subtitle2">
                {(playerAverages.extra.merchant * 100).toFixed(2)}%
              </Typography>
            </Box>
            <Box flex="1">
              <Typography variant="caption">Defender</Typography>
              <Typography variant="subtitle2">
                {playerAverages.extra.defender.toFixed(2)}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Tooltip placement="top-start" title="Science development card">
              <Box flex="1">
                <Typography variant="caption">Printer</Typography>
                <Typography variant="subtitle2">
                  {(playerAverages.extra.victoryScience * 100).toFixed(2)}%
                </Typography>
              </Box>
            </Tooltip>
            <Box flex="1" />
            <Tooltip placement="top-start" title="Politics development card">
              <Box flex="1">
                <Typography variant="caption">Constitution</Typography>
                <Typography variant="subtitle2">
                  {(playerAverages.extra.victoryPolitics * 100).toFixed(2)}%
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
      {/* <div>Win stats</div>
      <div>Trade: {playerAverages.winStats.development.trade}</div>
      <div>Politics: {playerAverages.winStats.development.politics}</div>
      <div>Science: {playerAverages.winStats.development.science}</div>
      <br />
      <div>Cities: {playerAverages.winStats.base.cities}</div>
      <div>Settlements: {playerAverages.winStats.base.settlements}</div>
      <br />
      <div>
        #{playerAverages.winStats.order?.order} -{" "}
        {playerAverages.winStats.order?.wins}
      </div> */}
    </Card>
  );
}

export default PlayerProfile;
