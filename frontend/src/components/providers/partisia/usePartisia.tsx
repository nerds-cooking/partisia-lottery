import { useContext } from "react";
import { PartisiaContext } from "./partisia-provider";

export const usePartisia = () => {
  const context = useContext(PartisiaContext);
  if (!context) {
    throw new Error("usePartisia must be used within a PartisiaProvider");
  }
  return context;
};
