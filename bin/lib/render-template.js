import { escapeCharacters } from "./character-reference.js";
import mustache from "mustache";

const renderTemplate = (template, view, partials = null) => mustache.render(template, view, partials, { escape: escapeCharacters });

export { renderTemplate };
