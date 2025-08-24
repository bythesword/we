import { color3U } from "./coreConst";

function isUrl(str: string): boolean {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlRegex.test(str);
}
function color3UTo3F(color: color3U) {
    return [color.red / 255, color.green / 255, color.blue / 255];
}