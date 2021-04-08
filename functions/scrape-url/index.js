const puppeteer = require("puppeteer");

const options = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

async function scrapeUrl(url) {
  const browser = await puppeteer
    .launch(options)
    .catch((e) => console.log("Launch error: ", e));
  const page = await browser.newPage();
  await page.goto(url).catch((e) => console.log("Goto error: ", e));

  const data = await page.evaluate(() => {
    const elements = document.body.getElementsByTagName("*");

    const images = Array.from(document.images, (e) => e.src);

    const styles = {
      fonts: {},
      colors: {},
      backgroundColors: {},
      fillColors: {},
      borderColors: {},
    };

    [...elements].forEach((element) => {
      element.focus();
      const css = window.getComputedStyle(element);

      const fontFamily = css.getPropertyValue("font-family");
      const color = css.getPropertyValue("color");
      const bgColor = css.getPropertyValue("background-color");
      const fill = css.getPropertyValue("fill");
      const borderColor = css.getPropertyValue("border-color");

      styles.fonts[fontFamily] = (styles.fonts[fontFamily] || 0) + 1;
      styles.colors[color] = (styles.colors[color] || 0) + 1;
      styles.backgroundColors[bgColor] =
        (styles.backgroundColors[bgColor] || 0) + 1;
      styles.fillColors[fill] = (styles.fillColors[fill] || 0) + 1;
      styles.borderColors[borderColor] =
        (styles.borderColors[borderColor] || 0) + 1;
    });

    return { styles, images };
  });

  await browser.close();
  return data;
}

module.exports = scrapeUrl;
