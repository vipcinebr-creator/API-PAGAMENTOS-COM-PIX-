const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-5092177616989788-032918-8a2c64a1c2b19e0a2c390d87dd627026-1838287409";

// 🔹 FUNÇÃO DE EXPIRAÇÃO (15 minutos)
function gerarExpiracao(minutos) {
  const data = new Date();
  data.setMinutes(data.getMinutes() + minutos);
  return data.toISOString();
}

// 🟢 GERAR PIX
app.post("/pix/gerar", async (req, res) => {
  try {
    const { valor } = req.body;

    const response = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: "Pagamento Pix",
        payment_method_id: "pix",
        date_of_expiration: gerarExpiracao(15), // ⏰ EXPIRAÇÃO AQUI
        payer: { email: "cliente@email.com" }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "X-Idempotency-Key": uuidv4()
        }
      }
    );

    const pix =
      response.data.point_of_interaction.transaction_data;

    res.json({
      id: response.data.id,
      copia_cola: pix.qr_code,
      qr_base64: pix.qr_code_base64,
      expira_em: response.data.date_of_expiration
    });

  } catch (e) {
    res.status(500).json({
      error: e.response?.data || e.message
    });
  }
});

// 🟢 VERIFICAR STATUS (GET)
app.get("/pix/status", async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "ID não informado" });
    }

    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({
      status: response.data.status
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🟢 ROTA RAIZ
app.get("/", (req, res) => {
  res.send("API PIX ONLINE");
});

app.listen(3000, () => {
  console.log("Pix API rodando com expiração");
});
