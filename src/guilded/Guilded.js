import axios from "axios";

const headers = {
  Authorization: `Bearer ${process.env.TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const GET = (url) => {
  return axios.get(url, {
    headers: headers,
  });
};

const POST = (url, body) => {
  return axios.post(url, body, { headers: headers });
};

const PUT = (url, body = {}) => {
  return axios.put(url, body, { headers: headers });
};

const DELETE = (url) => {
  return axios.delete(url, { headers: headers });
};

export default class Guilded {
  static types = {
    channels: "channels",
    messages: "messages",
    servers: "servers",
    members: "members",
    roles: "roles",
    listItem: "items",
  };

  static api = "https://www.guilded.gg/api/v1/";

  /* Webhooks */

  static sendHook = async (url, message = {}) => {
    return POST(url, message);
  };

  /* Message */

  static getMsg = async (channel, message) => {
    try {
      const theMessage = await GET(
        `${this.api}${this.types.channels}/${channel}/${this.types.messages}/${message}`
      );
      return theMessage.data;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  static getMsgs = async (channel) => {
    try {
      const theMessages = await GET(
        `${this.api}${this.types.channels}/${channel}/${this.types.messages}`
      );
      return theMessages.data;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  static sendMsg = async (channel, message = {}) => {
    try {
      return await POST(
        `${this.api}${this.types.channels}/${channel}/messages`,
        message
      );
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  /* Member */
  static getMember = async (server, member) => {
    try {
      const user = await GET(
        `${this.api}${this.types.servers}/${server}/${this.types.members}/${member}`
      );
      return user.data.member;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  /* Roles */

  static addRole = async (server, member, role) => {
    try {
      return await PUT(
        `${this.api}${this.types.servers}/${server}/${this.types.members}/${member}/${this.types.roles}/${role}`
      );
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  /* Lists */

  static addListItem = async (channel, message, note = {}) => {
    try {
      return await POST(
        `${this.api}${this.types.channels}/${channel}/${this.types.listItem}`,
        {
          message,
          note,
        }
      );
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  /* Channels */

  static getChannel = async (channel) => {
    try {
      const theChannel = await GET(
        `${this.api}${this.types.channels}/${channel}`
      );
      return theChannel.data.channel;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
      return e.response.data;
    }
  };

  static getServer = async (server) => {
    try {
      const theServer = await GET(
        `${this.api}/${this.types.servers}/${server}`
      );
      return theServer.data.server;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };

  /* Member Bans */
  // TODO: Refactor code to use id terminology
  static banMember = async (serverId, userId, reason) => {
    try {
      const theBannedMember = await POST(
        `${this.api}/servers/${serverId}/bans/${userId}`,
        {
          reason,
        }
      );
      return theBannedMember.data;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }
  };
}

export const getMsg = Guilded.getMsg;
export const getMsgs = Guilded.getMsgs;
export const sendMsg = Guilded.sendMsg;
export const getMember = Guilded.getMember;
export const addRole = Guilded.addRole;
export const addListItem = Guilded.addListItem;
export const getChannel = Guilded.getChannel;
export const getServer = Guilded.getServer;
export const banMember = Guilded.banMember;
