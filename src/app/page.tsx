"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
} from "@mui/material";

import { useQueryUpdater } from "./useQueryUpdater";
import { useCsvParser } from "./useCsvParser";
import Data from "./Data";
// import Data from "./Data";

export default function Home() {
  const searchParams = useSearchParams();
  const fileQuery = searchParams.get("file");

  const [fileUrl, setFileUrl] = useState(fileQuery || "");
  useQueryUpdater("file", fileUrl);

  console.time("parse");
  const { data, isLoading, error } = useCsvParser(fileUrl);
  console.timeEnd("parse");

  return (
    <Box pt={4}>
      <Box
        textAlign="center"
        display="flex"
        alignItems="center"
        flexDirection="column"
      >
        <Typography variant="h1">Catan stats</Typography>
        {!data && (
          <Typography variant="h2">👋 gimme something to visualize</Typography>
        )}
        <Box maxWidth={600} width="100%" pt={2}>
          <TextField
            value={fileUrl}
            label={error ? error : "CSV or JSON URL"}
            variant="outlined"
            fullWidth
            error={!!error}
            onChange={(event) => setFileUrl(event.target.value)}
            InputProps={{
              endAdornment: isLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={24} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      {data && <Data data={data} />}
    </Box>
  );
}
