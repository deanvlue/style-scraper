const puppeteer = require("puppeteer");

const options = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

async function scrapeUrl(url) {
  const browser = await puppeteer
    .launch(options)
    .catch((e) => console.error("Launch error: ", e));

  const page = await browser.newPage();

  await page.goto(url).catch((e) => {
    console.error("Goto error: ", e);
    throw new Error("Invalid URL");
  });

  const data = await page.evaluate(() => {
    const separateColors = /(?<=\)) (?=r)/;
    const elements = document.body.getElementsByTagName("*");

    const images = {};

    Array.from(document.images, (e) => e.src).forEach(
      (image) => (images[image] = (images[image] || 0) + 1)
    );

    const styles = {
      fonts: {},
      colors: {},
      backgroundColors: {},
      fillColors: {},
      borderColors: {},
    };

    const add = (value, prop) =>
      (styles[prop][value] = (styles[prop][value] || 0) + 1);

    [...elements].forEach((element) => {
      element.focus();
      const css = window.getComputedStyle(element);

      const fontFamily = css.getPropertyValue("font-family");
      const color = css.getPropertyValue("color");
      const bgColor = css.getPropertyValue("background-color");
      const fill = css.getPropertyValue("fill");

      add(fontFamily, "fonts");
      add(color, "colors");
      add(bgColor, "backgroundColors");
      add(fill, "fillColors");

      const tempBorderColors = css.getPropertyValue("border-color");
      tempBorderColors
        .split(separateColors)
        .map((color) => add(color, "borderColors"));
    });

    const getOrdered = (obj) => {
      const sortByOccurency = (arr) => {
        return arr.sort((a, b) => b[1] - a[1]);
      };
      return sortByOccurency(Object.entries(obj));
    };

    return {
      fonts: getOrdered(styles.fonts),
      colors: getOrdered(styles.colors),
      backgroundColors: getOrdered(styles.backgroundColors),
      fillColors: getOrdered(styles.fillColors),
      borderColors: getOrdered(styles.borderColors),
      images: getOrdered(images),
    };
  });

  await browser.close();

  return data;
}

module.exports = scrapeUrl;
