import { Client, Role, MessageReaction, GuildMemberRoleManager, User, PartialUser, DiscordAPIError } from 'discord.js';
import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/app/discord_service';

/* examples of valid role messages:

react with :CelestiaFire: to get the role @testRole2
react with 👍 to get the role @testRole1

*/
const REGEX = /^react with ?(?:<:([^:]+):\d+>|(\S{1,4})) ?to get the role ?<@&(\d+)>$/i;

export class RoleBotHook implements Hook {
    private readonly client: Client;

    constructor(
        private readonly discordService: DiscordService
    ) {
        this.client = this.discordService.getClient();
    }

    async init() {
        const { client } = this;

        client.on('messageReactionAdd', async (reaction, user) => {
            await process(reaction, user, (r, role) => r.add(role));
        });

        client.on('messageReactionRemove', async (remove, user) => {
            await process(remove, user, (r, role) => r.remove(role));
        });

        client.on('message', async (msg) => {
            const match = REGEX.exec(msg.content);
        
            if (match === null) return `no match: ${msg.content}`;
            const [_content, reactThisId, unicodeEmoji, roleId] = match;

            // const roleName = (await msg.guild?.roles.fetch(roleId))?.name;
            
            if (unicodeEmoji) {
                console.log(`New role message for role ${roleId}: ${unicodeEmoji}`);
                msg.react(unicodeEmoji.trim());
            }
            else {
                console.log(`New role message for role ${roleId}: ${reactThisId}`);
                // use .find() to call the discord api to fetch all emojis
                const guildEmoji = msg.guild?.emojis.cache.find(em => em.name === reactThisId);
                if (guildEmoji) {
                    msg.react(guildEmoji);
                }
                else {
                    msg.reply(`emoji :${reactThisId}: could not be found in this server, please use a different emoji`);
                }
            }
        });

        // triggered when a bot removes an emoji
        // this.client.on('messageReactionRemoveEmoji', (remove) => {
        //     getInfo(remove, (r, role) => r.remove(role));
        // });

    }
}

async function getInfo(
    reaction: MessageReaction, 
    user: User | PartialUser, 
    cb: (roles: GuildMemberRoleManager, role: Role) => Promise<any>
): Promise<string | 'n/a' | 'success' | 'bot'> {

    if (user.bot) return 'bot';

    let message = reaction.message;

    if (message.partial) {
        // if this message was created before this current process, it will only be partially cached.
        // this message will probably always be an uncached message, so we need to get the full version from the api.
        message = await message.fetch();
    }
    
    const match = REGEX.exec(message.content);

    if (match === null) return 'n/a';

    const [_content, reactThisId, unicodeEmoji, roleId] = match;

    if (reactThisId && reaction.emoji.name !== reactThisId) {
        return `custom emoji did not match ${reactThisId} != ${reaction.emoji.name}`;
    }
    if (unicodeEmoji && reaction.emoji.name !== unicodeEmoji) {
        return `unicode did not match ${unicodeEmoji} != ${reaction.emoji.name}`;
    }

    const guild = reaction.message.guild;
    if (!guild) return 'no guild/server';

    const role = guild.roles.cache.find(role => role.id == roleId);
    if (!role) return `role did not exist: ${guild.roles.cache.map(r => r.id)} != ${roleId}`;
    
    const member = guild.members.cache.array().find(meem => meem.id === user.id);
    if (!member) return `did not find member ${user.id}`;

    try {
        await cb(member.roles, role);
    }
    catch (e) {
        if (e instanceof DiscordAPIError)
            return e.message;
        return String(e);
    }

    return 'success';
}


async function process(
    reaction: MessageReaction, 
    user: User | PartialUser, 
    cb: (roles: GuildMemberRoleManager, role: Role) => Promise<any>
) {
    const v = await getInfo(reaction, user, cb);
    if (['n/a', 'success', 'bot'].includes(v) === false) {
        reaction.remove();
        console.log(v);
    }
}