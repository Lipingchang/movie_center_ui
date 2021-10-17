import React from "react";
import { connect } from "react-redux";
import { ConnectState } from '@/models/connect';
import MovieImportFromFile from "./MovieImportFromFile";

function MovieImport(props: ConnectState) {
  return (
    <MovieImportFromFile/>
  )
}

export default connect((state: ConnectState) => ({
  ...state
}))(MovieImport)

