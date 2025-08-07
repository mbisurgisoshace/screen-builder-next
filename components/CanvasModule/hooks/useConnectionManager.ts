// CanvasModule/hooks/useConnectionManager.ts
import { useState } from "react";

export type ConnectorPosition = "top" | "right" | "bottom" | "left";

export interface Connection {
  fromId: number;
  fromPosition: ConnectorPosition;
  toId: number;
  toPosition: ConnectorPosition;
}

export function useConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([]);

  const [connectingFrom, setConnectingFrom] = useState<{
    shapeId: number;
    position: ConnectorPosition;
  } | null>(null);

  const [connectionPreview, setConnectionPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const addConnection = (connection: Connection) => {
    setConnections((prev) => [...prev, connection]);
  };

  const clearPreview = () => {
    setConnectingFrom(null);
    setConnectionPreview(null);
  };

  return {
    connections,
    addConnection,

    connectingFrom,
    setConnectingFrom,

    connectionPreview,
    setConnectionPreview,

    clearPreview,
  };
}
