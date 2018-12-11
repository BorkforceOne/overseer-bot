import { Client } from "discord.js";
import { Hooks } from "./hooks";

const client = new Client();
const hooks = new Hooks(client);

hooks.init();

client.login(process.env.API_KEY);
