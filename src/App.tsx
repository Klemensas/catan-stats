import React, { useState } from "react";
import "./App.css";
import { useCsvParser } from "./useCsvParser";
import { useLocationUpdater } from "./useLocationUpdater";
import {
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
} from "@material-ui/core";
import Data from "./Data";

function App() {
  const searchParams = new URLSearchParams(window.location.search.slice(1));
  const fileQuery = searchParams.get("file");

  const [fileUrl, setFileUrl] = useState(fileQuery || "");

  console.time("parse");
  const { data, isLoading, error } = useCsvParser(fileUrl);
  console.timeEnd("parse");
  console.error("pppp", data);
  useLocationUpdater(fileUrl);

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
            label={error ? error?.toString() : "CSV or JSON URL"}
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

export default App;
