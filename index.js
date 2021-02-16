const puppeteer = require("puppeteer");
fs = require("fs");

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const styles = await page.evaluate(() => {
    const elements = document.body.getElementsByTagName("*");

    const images = Array.from(document.images, (e) => e.src);

    const styles = {
      fonts: [],
      colors: [],
      backgroundColors: [],
      fillColors: [],
      borderColors: [],
    };

    [...elements].forEach((element) => {
      element.focus();
      const css = window.getComputedStyle(element);

      styles.fonts.push(css.getPropertyValue("font-family"));
      styles.colors.push(css.getPropertyValue("color"));
      styles.backgroundColors.push(css.getPropertyValue("background-color"));
      styles.fillColors.push(css.getPropertyValue("fill"));
      styles.borderColors.push(css.getPropertyValue("border-color"));
    });

    return { styles, images };
  });

  console.log("WRITING TO styles.txt");
  fs.writeFile("styles.json", JSON.stringify(styles), (e) => {
    if (e) throw e;
    console.log("Output written to styles.json file");
  });

  await browser.close();
}

const cirkul = "https://drinkcirkul.com/";
const aldhair = "https://aldhairescobar.com/";
scrape(aldhair);
