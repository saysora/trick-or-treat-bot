import axios from "axios";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    let response;
    try {
      response = await GET(
        `${this.api}${this.types.channels}/${channel}/${this.types.messages}/${message}`
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.getMsg(channel, message);
    }
  };

  static getMsgs = async (channel) => {
    let response;
    try {
      response = await GET(
        `${this.api}${this.types.channels}/${channel}/${this.types.messages}`
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.getMsgs(channel);
    }
  };

  static sendMsg = async (channel, message = {}) => {
    let response;
    try {
      response = await POST(
        `${this.api}${this.types.channels}/${channel}/messages`,
        message
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
      // return
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.sendMsg(channel, message);
    }
  };

  static delMsg = async (channel, message) => {
    let response;
    try {
      response = await DELETE(
        `${this.api}${this.types.channels}/${channel}/messages/${message}`
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.delMsg(channel, message);
    }
  };

  static updateMsg = async (channel, messageId, message = {}) => {
    let response;
    try {
      response = await PUT(
        `${this.api}${this.types.channels}/${channel}/messages/${messageId}`,
        message
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.updateMsg(channel, messageId, message);
    }
  };

  /* Reactions */

  static addReaction = async (channel, message, reactionId) => {
    let response;

    try {
      response = await PUT(
        `${this.api}${this.types.channels}/${channel}/content/${message}/emotes/${reactionId}`
      );

      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.addReaction(channel, message, reactionId);
    }
  };

  /* Member */
  static getMember = async (server, member) => {
    let response;
    try {
      response = await GET(
        `${this.api}${this.types.servers}/${server}/${this.types.members}/${member}`
      );
      return response.data.member;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.getMember(server, member);
    }
  };

  /* Roles */

  static addRole = async (server, member, role) => {
    let response;
    try {
      response = await PUT(
        `${this.api}${this.types.servers}/${server}/${this.types.members}/${member}/${this.types.roles}/${role}`
      );
      return response;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.addRole(server, member, role);
    }
  };

  /* Lists */

  static addListItem = async (channel, message, note = {}) => {
    let response;
    try {
      response = await POST(
        `${this.api}${this.types.channels}/${channel}/${this.types.listItem}`,
        {
          message,
          note,
        }
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.addListItem(channel, message, note);
    }
  };

  /* Channels */

  static getChannel = async (channel) => {
    let response;
    try {
      response = await GET(`${this.api}${this.types.channels}/${channel}`);
      return response.data.channel;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }
    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.getChannel(channel);
    }
  };

  static getServer = async (server) => {
    let response;
    try {
      response = await GET(`${this.api}/${this.types.servers}/${server}`);
      return response.data.server;
    } catch (e) {
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.getServer(server);
    }
  };

  /* Member Bans */
  // TODO: Refactor code to use id terminology
  static banMember = async (serverId, userId, reason) => {
    let response;
    try {
      response = await POST(`${this.api}/servers/${serverId}/bans/${userId}`, {
        reason,
      });
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }
    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.banMember(serverId, userId, reason);
    }
  };

  static kickMember = async (serverId, userId) => {
    let response;
    try {
      response = await DELETE(
        `${this.api}/servers/${serverId}/members/${userId}`
      );
      return response.data;
    } catch (e) {
      response = e;
      console.error(JSON.stringify(e.response.data, null, 2));
    }

    if (response.status === 429) {
      const retryTime = parseInt(response.headers["Retry-After"]);
      await sleep(retryTime * 1000);
      return this.kickMember(serverId, userId);
    }
  };
}

export const getMsg = Guilded.getMsg;
export const getMsgs = Guilded.getMsgs;
export const sendMsg = Guilded.sendMsg;
export const updateMsg = Guilded.updateMsg;
export const delMsg = Guilded.delMsg;
export const addReaction = Guilded.addReaction;
export const getMember = Guilded.getMember;
export const addRole = Guilded.addRole;
export const addListItem = Guilded.addListItem;
export const getChannel = Guilded.getChannel;
export const getServer = Guilded.getServer;
export const banMember = Guilded.banMember;
export const kickMember = Guilded.kickMember;
export const testTimeout = Guilded.testTimeout;
