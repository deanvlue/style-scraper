const express = require("express");
const app = express();
const cors = require("cors");

const PORT = process.env.PORT || 8080;

const getStyles = require("./functions/scrape-url");

const options = { origin: "*" };

app.use(express.json());
app.use(cors(options));

app.listen(PORT, () => console.log(`Alive on localhost:${PORT}`));

app.post("/get-style-from-url", async (req, res) => {
  const { url } = req.body;

  if (!url) res.status(418).send({ message: "No URL sent" });

  try {
    const styles = await getStyles(url);

    res.status(200).send({
      data: {
        ...styles,
      },
      message: `Parsed: ${url}`,
    });
  } catch (e) {
    if (e.message === "Invalid URL")
      return res.status(400).send({ message: e.message });
    console.error(e);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
