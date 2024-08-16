export async function getUrl(url: string) {

    let text = await new Promise((resolve, reject) => {
        let xml = new XMLHttpRequest();
        xml.open("GET", url);

        xml.send();
        xml.onload = () => {
            console.log("OK", xml);
            if (xml.status == 200) {
                resolve(xml.response);
            } else if (xml.status == 404) {
                reject(new Error("404"));
            } else {
                reject(new Error("error"));
            }
        };
    });
    return text;
}