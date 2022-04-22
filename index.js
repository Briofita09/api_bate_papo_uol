import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("api_bate_papo_uol");
  console.log("conectou ao banco");
});

app.post("/add", (req, res) => {
  let user = req.body;
  async function findUser() {
    try {
      let userFound = await db
        .collection("participants")
        .findOne({ email: user.email });
      if (userFound !== null) {
        res.send(409).json("Usuário já cadastrado na plataforma.");
      }
      await db
        .collection("participants")
        .insertOne({ ...user, lastStatus: Date.now() });
      await db.collection("messages").insertOne({
        from: user.email,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: Date.now(),
      });
      res.sendStatus(201);
    } catch (err) {
      console.log(err);
    }
  }
  findUser();
});

app.get("/participants", (req, res) => {
  async function getParticipants() {
    try {
      let participants = await db.collection("participants").find().toArray();
      res.status(200).json(participants);
    } catch (err) {
      res.send(404).json({ msg: "Erro ao buscar participantes" });
    }
  }
  getParticipants();
});

app.post("/messages", (req, res) => {
  async function postMessage() {
    let message = req.body;
    try {
      if (
        (message.to !== "" || message.text !== "") &&
        (message.type === "message" || message.type === "private_message")
      ) {
        await db
          .collection("messages")
          .insertOne({ ...message, time: Date.now() });
        res.status(201).send("mensagem enviada");
      }
      res.sendStatus(422);
    } catch (err) {
      console.log(err);
      res.status(400).send("Não foi possivel enviar a mensagem");
    }
  }
  postMessage();
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
