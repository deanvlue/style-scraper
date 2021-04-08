const express = require("express");
const app = express();

const cors = require("cors");

const PORT = process.env.PORT || "8080";

const getStyles = require("./functions/scrape-url");

const options = { origin: "*" };

app.use(express.json());
app.use(cors(options));

app.listen(PORT, () => console.log(`Alive on localhost:${PORT}`));

app.post("/get-style-from-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(418).send({ message: "No URL found" });
  }

  const styles = await getStyles(url);

  res.send({
    data: {
      ...styles,
    },
    message: `Your url: ${url}`,
  });
});
