import type { ServerWebSocket } from "bun";

export type GroupChatSocketData = {
  channelId: string | null;
  username: string | null;
  action?: string;
  value?: number;
};

const GROUP_CHAT_CHANNEL = "the-group-chat";

type PublishServer = {
  publish: (channel: string, message: string) => void;
};

const getPresenceMessage = (
  username: string | null,
  action: "entered" | "left",
) => {
  return `${username} has ${action} the chat`;
};

export const createGroupChatWebsocket = (getServer: () => PublishServer) => ({
  perMessageDeflate: true,
  data: {} as GroupChatSocketData,
  message(ws: ServerWebSocket<GroupChatSocketData>, message: unknown) {
    getServer().publish(
      GROUP_CHAT_CHANNEL,
      `${ws.data.username}:   ${ws.data.action}: ${ws.data.value} ${String(message)}`,
    );
    console.log(ws.subscriptions);
  },
  open(ws: ServerWebSocket<GroupChatSocketData>) {
    const msg = getPresenceMessage(ws.data.username, "entered");
    ws.subscribe(GROUP_CHAT_CHANNEL);
    getServer().publish(GROUP_CHAT_CHANNEL, msg);

    console.log("OPEN", msg);
  },
  close(ws: ServerWebSocket<GroupChatSocketData>) {
    const msg = getPresenceMessage(ws.data.username, "left");
    ws.unsubscribe(GROUP_CHAT_CHANNEL);
    getServer().publish(GROUP_CHAT_CHANNEL, msg);
  },
  drain(ws: ServerWebSocket<GroupChatSocketData>) {
    ws.send("DRAIN !!!!");
  },
});
