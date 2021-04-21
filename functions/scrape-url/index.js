const puppeteer = require("puppeteer");

const options = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-web-security",
  ],
};

async function scrapeUrl(url) {
  const browser = await puppeteer
    .launch(options)
    .catch((e) => console.error("Launch error: ", e));

  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" }).catch((e) => {
    console.error("Goto error: ", e);
    throw new Error("Invalid URL");
  });

  const data = await page.evaluate(() => {
    const separateColors = /(?<=\)) (?=r)/;

    function parseFontsFromCSSString(css) {
      const currentHost = window.location.host;
      const fontFaceRegex = /\@font\-face\s?\{([\s\S]+?)\}/gm;
      const fontFamilyRegex = /font\-family\:\s?(.*)/;
      const urlRegex = /url\(['"]?(.+?)['"]?\)/g;

      const matches = css.matchAll(fontFaceRegex);

      if (!matches) {
        return;
      }

      const results = {};

      for (const match of matches) {
        const rules = match[1];

        // Split our declaration by line and by semicolon
        const lines = rules
          .split(/;\n?/)
          .map((line) => line.trim())
          .filter((v) => v);

        // Find the font-family rule:
        const familyLine = lines.find((line) => fontFamilyRegex.test(line));

        if (!familyLine) {
          continue;
        }

        const family = familyLine.match(fontFamilyRegex)[1];

        const familyUrls = [];

        // Extract the URLs from the raw lines
        for (const line of lines) {
          const urlMatches = line.matchAll(urlRegex);
          if (!urlMatches) {
            continue;
          }
          for (const urlMatch of urlMatches) {
            let rawUrl = urlMatch[1];
            // Add a host if one isn't specified
            const absoluteUrl = new URL(rawUrl, document.baseURI).href;
            familyUrls.push(absoluteUrl);
          }
        }

        results[family] = familyUrls;
      }

      return results;
    }

    function getAllStyles() {
      const styles = [];
      for (const sheet of document.styleSheets) {
        const rules = sheet?.cssRules || sheet?.rules;
        for (const rule of rules) {
          const style =
            rule.cssText || `${rule.selectorText} { ${rule.style.cssText}`;
          styles.push(style);
        }
      }

      return styles;
    }

    const elements = document.body.getElementsByTagName("*");

    const images = {};

    Array.from(document.images, (e) => e.src).forEach(
      (image) => (images[image] = (images[image] || 0) + 1)
    );

    const input = getAllStyles().join("\n");
    const fontFaces = parseFontsFromCSSString(input);

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
      fontFaces,
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
