import React, { useState } from "react";
import "./App.css";
import { useCsvParser } from "./useCsvParser";
import { useLocationUpdater } from "./useLocationUpdater";
import {
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
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
    <div style={{ paddingTop: "10vh" }}>
      <div style={{ textAlign: "center" }}>
        {!data && (
          <Typography variant="h1" style={{ paddingBottom: "2rem" }}>
            👋 input a file
          </Typography>
        )}
        <TextField
          id="outlined-basic"
          value={fileUrl}
          label={error ? error?.toString() : "CSV or JSON URL"}
          variant="outlined"
          fullWidth
          error={!!error}
          onChange={(event) => setFileUrl(event.target.value)}
          style={{ maxWidth: "60vw" }}
          InputProps={{
            endAdornment: isLoading && (
              <InputAdornment position="end">
                <CircularProgress size={24} />
              </InputAdornment>
            ),
          }}
        />
        {data && <Data data={data} />}
      </div>
    </div>
  );
}

export default App;
