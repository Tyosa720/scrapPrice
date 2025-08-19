// ===== services/discord.js =====
const axios = require('axios');

class DiscordNotifier {
  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  // Envoyer une alerte de baisse de prix
  async sendPriceAlert(productName, newPrice, oldPrice, productUrl) {
    if (!this.webhookUrl) {
      console.warn('⚠️  URL webhook Discord non configurée');
      return;
    }

    const reduction = oldPrice - newPrice;
    const reductionPercent = Math.round((reduction / oldPrice) * 100);

    const embed = {
      title: "🎉 Promo détectée !",
      description: `**${productName}**`,
      color: 0x00ff00, // Vert
      fields: [
        {
          name: "💰 Nouveau prix",
          value: `${newPrice}€`,
          inline: true
        },
        {
          name: "📈 Ancien prix",
          value: `~~${oldPrice}€~~`,
          inline: true
        },
        {
          name: "💸 Réduction",
          value: `-${reduction.toFixed(2)}€ (-${reductionPercent}%)`,
          inline: true
        }
      ],
      url: productUrl,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Price Tracker Bot"
      }
    };

    const payload = {
      content: `🚨 **ALERTE PROMO** 🚨`,
      embeds: [embed]
    };

    try {
      await axios.post(this.webhookUrl, payload);
      console.log('✅ Notification Discord envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi Discord:', error.message);
      throw error;
    }
  }

  // Envoyer un message de test
  async sendTestMessage() {
    if (!this.webhookUrl) {
      throw new Error('URL webhook Discord non configurée');
    }

    const payload = {
      content: "🤖 Test de notification - Le bot fonctionne correctement !",
      embeds: [{
        title: "Test du Price Tracker",
        description: "Si vous recevez ce message, les notifications fonctionnent !",
        color: 0x0099ff,
        timestamp: new Date().toISOString()
      }]
    };

    await axios.post(this.webhookUrl, payload);
  }
}

module.exports = new DiscordNotifier();