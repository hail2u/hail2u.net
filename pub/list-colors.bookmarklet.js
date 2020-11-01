var nodes = document.querySelectorAll("*"),
  l = nodes.length,
  i,
  matches = [],
  j,
  m,
  color,
  colors = {},
  doc = document,
  styles = doc.styleSheets,
  ul = "<ul style='margin: 0 auto; padding: 0; width: 768px;'>",
  li;

for (i = 0; i < l; i++) {
  matches = getComputedStyle(nodes[i]).cssText.match(/rgba?\(\d{1,3}, \d{1,3}, \d{1,3}(, \d(\.\d+)?)?\)/g);
  m = matches.length;

  for (j = 0; j < m; j++) {
    color = matches[j];

    if (colors[color]) {
      colors[color]++;
    } else {
      colors[color] = 1;
    }
  }
}

for (i = 0, l = styles.length; i < l; i++) {
  styles[0].disabled = true;
}

for (color in colors) {
  if (colors.hasOwnProperty(color)) {
    li = [
      "<li style='margin: 8px; padding: 0; border: 1px solid #ccc; display: block; float: left; box-shadow: 0 0 4px #ccc; background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAQHRrUGdUa1BORyAgQ29weVJpZ2h0IFRha2kgQWxsIFJpZ2h0IFJlc2VydmVkAI0AAA0AAABSREhJmDlXAOa9SQCQkWg2mDWMHgAAAB5JREFUKM9j+H9jL3aEAzCMaqCNBlwAh0GjGmiiAQBn/cifTDaT1wAAAABJRU5ErkJggg==\");'><div style='width: 238px; height: 100px; background-color:",
      color,
      ";'></div><div style='border-top: 1px solid #ccc; width: 238px; line-height: 32px; overflow: hidden; color: #000; background-color: #eee; font-family: \"Monaco\", \"Andale Mono\", monospace; font-size: 14px; text-align: center; white-space: nowrap;'>",
      color,
      "</div></li>"
    ].join("");
    ul += li;
  }
}

doc.body.innerHTML = ul + "</ul>";
