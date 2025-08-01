const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys')
const P = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')

const { state, saveState } = useSingleFileAuthState('./session.json')

const startBot = () => {
  const client = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true
  })

  client.ev.on('creds.update', saveState)

  client.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if(connection === 'close') {
      if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot()
      }
    }
  })

  client.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if(!msg.message || msg.key.fromMe) return

      const command = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      const now = new Date()
      const hour = now.getHours()

      // Só funciona das 8h às 23h
      if(hour < 8 || hour >= 23) {
        await client.sendMessage(msg.key.remoteJid, { text: '⚠️ O bot funciona das 08:00 às 23:00. Por favor, tente novamente nesse horário.' }, { quoted: msg })
        return
      }

      if(command.startsWith('/roll')) {
        const roll = Math.floor(Math.random() * 20) + 1
        await client.sendMessage(msg.key.remoteJid, { text: `🎲 Você rolou o dado e tirou ${roll}` }, { quoted: msg })
        return
      }

      if(command === '/registrar') {
        await client.sendMessage(msg.key.remoteJid, { text: '✅ Você foi registrado com sucesso!' }, { quoted: msg })
        return
      }

      if(command === '/perfil') {
        await client.sendMessage(msg.key.remoteJid, { text: '👤 Perfil: Level 3, XP 1500, Dinheiro 500' }, { quoted: msg })
        return
      }

      if(command === '/trabalhar') {
        await client.sendMessage(msg.key.remoteJid, { text: '💼 Você trabalhou e ganhou 50 moedas!' }, { quoted: msg })
        return
      }

    } catch (e) {
      console.error(e)
    }
  })
}

startBot()
