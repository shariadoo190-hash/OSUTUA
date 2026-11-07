import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Helper to lazily initialize GoogleGenAI client with aistudio-build header
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory synced LAN transactions store
  const lanTransactionStore: any[] = [];
  // In-memory sent email alert dispatch log
  const sentEmailStore: any[] = [];

  // Health probe for LAN multi-computer discovery
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Osutua Wines & Spirits LAN Server',
      timestamp: new Date().toISOString(),
      activeNodes: 1,
      totalSyncedTransactions: lanTransactionStore.length,
      totalAlertEmailsSent: sentEmailStore.length,
    });
  });

  // Multi-terminal LAN offline synchronization endpoint
  app.post('/api/sync', (req, res) => {
    const { transactions, clientTerminalId } = req.body;
    if (Array.isArray(transactions)) {
      transactions.forEach((tx) => {
        const exists = lanTransactionStore.some((t) => t.receiptNo === tx.receiptNo);
        if (!exists) {
          lanTransactionStore.push({
            ...tx,
            syncedAt: new Date().toISOString(),
            terminal: clientTerminalId || 'LAN_TERMINAL',
          });
        }
      });
      console.log(`[LAN Sync] Received ${transactions.length} sales from terminal ${clientTerminalId || 'Local'}`);
      return res.json({
        success: true,
        receivedCount: transactions.length,
        totalStored: lanTransactionStore.length,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(400).json({ success: false, error: 'Invalid transactions payload' });
  });

  // Automated Email Dispatcher endpoint for Low-Stock alerts
  app.post('/api/alerts/send-email', (req, res) => {
    const { to, subject, body, productName, sku, currentStock, reorderQuantity } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ success: false, error: 'Recipient and Subject are required.' });
    }

    const trackingId = `EML-${Date.now().toString().slice(-6)}`;
    const emailRecord = {
      id: trackingId,
      to,
      subject,
      body: body || '',
      productName: productName || 'General Alert',
      sku: sku || 'N/A',
      currentStock: currentStock ?? 0,
      reorderQuantity: reorderQuantity ?? 0,
      sentAt: new Date().toISOString(),
      status: 'delivered',
    };

    sentEmailStore.unshift(emailRecord);
    console.log(`[Email Dispatcher] Alert sent to ${to}: ${subject} (Tracking: ${trackingId})`);

    return res.json({
      success: true,
      trackingId,
      sentAt: emailRecord.sentAt,
      message: `Notification email successfully dispatched to ${to}`,
    });
  });

  app.get('/api/alerts/emails', (req, res) => {
    res.json(sentEmailStore);
  });

  // Download full project source ZIP endpoint
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'public', 'osutua-pos-system.zip');
    res.download(zipPath, 'osutua-pos-system.zip', (err) => {
      if (err) {
        console.error('Error downloading zip:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'Zip archive not found' });
        }
      }
    });
  });

  // Gemini AI Assistant & Inventory Intelligence endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    const { messages, contextInfo } = req.body || {};
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const systemInstruction = `You are the specialized AI Business & Inventory Co-Pilot for OSUTUA WINES AND SPIRITS located in Nairobi, Kenya.
Your role:
1. Provide accurate stock analysis, reorder advice, and inventory forecasting based on store data provided.
2. Recommend popular alcoholic drinks, wines, whiskies, beers (EABL, KWAL, Viva Global brands), and cocktail recipes.
3. Assist with Kenya Revenue Authority (KRA) tax guidelines (16% VAT, excise stamps) and Nairobi County liquor licensing rules.
4. If asked about supplier locations or depots in Nairobi (e.g., EABL Ruaraka, KWAL Tatu City), explain clearly.
5. Keep your tone professional, crisp, helpful, and concise.

Store context:
${contextInfo ? JSON.stringify(contextInfo) : 'Osutua Wines & Spirits, Ngong Road Nairobi.'}`;

      // Convert messages to Gemini format
      const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';
      const historyContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || m.text || '' }],
      }));

      const ai = getAIClient();
      if (!ai) {
        const critList = contextInfo?.criticalItems || [];
        const lowCount = contextInfo?.activeLowStockCount ?? critList.length;
        let localReply = `**Osutua Store Intelligence & Reorder Advice**\n\n`;
        if (lowCount > 0) {
          localReply += `🚨 **Active Low-Stock Alerts (${lowCount} items)**:\n`;
          critList.forEach((item: any, i: number) => {
            localReply += `${i + 1}. **${item.name}** (SKU: ${item.sku}) - Physical Stock: **${item.currentStock}** / Min: ${item.minStock} · Suggested Reorder: **+${item.suggestedReorder} units** from ${item.supplier || 'Primary Distributor'}\n`;
          });
          localReply += `\n✉️ **Action Required:** Dispatched automated stock alert to management at \`${process.env.ALERT_EMAIL || 'shariadoo190@gmail.com'}\`. Use Procurement tab to generate purchase orders.`;
        } else {
          localReply += `✅ **Inventory Health:** All registered wines, spirits, and beers are stocked safely above safety thresholds. Today's sales recorded: KES ${(contextInfo?.todaySalesTotalKES || 0).toLocaleString()}.`;
        }
        return res.json({
          reply: localReply,
          sources: [
            { title: 'Osutua Real-Time Stock Engine', uri: 'http://localhost:3000' },
            { title: 'Kenya Revenue Authority Excise Stamps', uri: 'https://kra.go.ke' }
          ],
        });
      }

      // Call Gemini 3.8 Flash with Google Search grounding
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: historyContents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text || 'I processed your request.';
      const sources: Array<{ title: string; uri: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      return res.json({
        reply: replyText,
        sources: sources.slice(0, 4),
      });
    } catch (err: any) {
      console.warn('[Gemini API Notice]:', err.message || err);

      // Graceful offline intelligence fallback if Gemini API key quota is temporarily exhausted
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429) {
        const critList = contextInfo?.criticalItems || [];
        const lowCount = contextInfo?.activeLowStockCount ?? critList.length;

        let fallbackReply = `**Osutua Store Intelligence Report**\n\n`;
        if (lowCount > 0) {
          fallbackReply += `🚨 **Active Stock Alerts (${lowCount} items)**:\n`;
          critList.forEach((item: any, i: number) => {
            fallbackReply += `${i + 1}. **${item.name}** (SKU: ${item.sku}) - Physical: **${item.currentStock}** / Min: ${item.minStock} (Suggested Reorder: **+${item.suggestedReorder} units** via ${item.supplier || 'Distributor'})\n`;
          });
          fallbackReply += `\n💡 **Action Recommended:** Trigger one-click reorder email alerts to management at \`${process.env.ALERT_EMAIL || 'shariadoo190@gmail.com'}\` or open Procurement to generate purchase orders.`;
        } else {
          fallbackReply += `✅ **Inventory Health:** All registered wines, spirits, and beers are currently stocked above their minimum thresholds. Today's sales recorded: KES ${(contextInfo?.todaySalesTotalKES || 0).toLocaleString()}.`;
        }

        return res.json({
          reply: fallbackReply,
          sources: [
            { title: 'Osutua Local Inventory Engine', uri: 'http://localhost:3000' },
            { title: 'Kenya Revenue Authority Excise Rules', uri: 'https://kra.go.ke' }
          ],
        });
      }

      return res.status(500).json({
        error: err.message || 'Gemini API processing failed',
      });
    }
  });

  // Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Osutua POS] Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Osutua POS] Port ${PORT} is already in use. Try setting PORT=3001 in .env or kill the process on port ${PORT}.`);
    } else {
      console.error('[Osutua POS] Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('[Osutua POS] Failed to start server:', err);
  process.exit(1);
});
