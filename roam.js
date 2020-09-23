const templateName = "Daily Template";
let graph, db;

function deepPullNode(eid) {
  return roamAlphaAPI.pull(
    `[:node/title {:block/children [:db/id :block/order :block/string { :block/children ...}]}]`,
    eid,
  );
}

function nodeByTitle(title) {
  return roamAlphaAPI.q(`[:find ?e :where [?e :node/title "${title}"]]`);
}

function nodeToString(deepEntity, level = 0) {
  const indent = (level + 1) * 4;
  const children = (deepEntity[":block/children"] || [])
    .sort((a, b) => a[":block/order"] - b[":block/order"])
    .map((child) => {
      const childStr = nodeToString(child, level + 1);
      return `${" ".repeat(indent)}- ${childStr}`;
    });
  return `${deepEntity[":block/string"] || ""}
${children.join("\n")}`;
}

function dailyTemplateStr() {
  const eid = nodeByTitle(templateName)[0][0];
  const entity = deepPullNode(eid);

  return nodeToString(entity);
}

function onHashChange(evt, repeat) {
  const hash = window.location.href.split("#")[1];
  if (hash === `/app/${graph}`) {
    const today = moment().format("MMMM Do, YYYY");
    const todayQuery = nodeByTitle(today);
    if (todayQuery.length > 0) {
      const todayEnt = deepPullNode(todayQuery[0][0]);
      if (
        !(todayEnt[":block/children"] || []).some((el) =>
          (el[":block/string"] || "").length > 0
        )
      ) {
        const str = dailyTemplateStr();
        // click the first node
        document.querySelector(".rm-block-text").dispatchEvent(
          new MouseEvent("mousedown", {
            view: window,
            buttons: 1,
            bubbles: true,
            cancelable: true,
          }),
        );

        // pause to let roam update the active textarea
        window.setTimeout(function () {
          const textarea = document.querySelector("textarea:first-of-type");
          if (textarea.value.length === 0) {
            textarea.value = str;
            const data = new DataTransfer();
            data.setData("text", str);
            textarea.dispatchEvent(
              new ClipboardEvent(
                "paste",
                {
                  clipboardData: data,
                  data: str,
                  view: window,
                  bubbles: true,
                  cancelable: true,
                },
              ),
            );
          }
        }, 100);
      }
    }
  }

  if (repeat) {
    setTimeout(() => onHashChange(null, true), 1000);
  }
}

function loadJS(url) {
  if (document.querySelector(`script[src='${url}']`) !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = url;
    tag.onload = () => resolve();
    tag.onerror = () => reject();

    document.head.appendChild(tag);
  });
}

async function init() {
  await loadJS(
    "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min.js",
  );

  return { graph: localStorage.getItem("lastUsedGraph") };
}

if (!/Mobi|Android/i.test(navigator.userAgent) || true) {
  init().then((data) => {
    graph = data.graph;

    window.removeEventListener("hashchange", onHashChange);
    window.addEventListener("hashchange", onHashChange);

    setTimeout(() => onHashChange(null, true), 1000);
  });
}

// Before roamAlphaAPI was a thing, we needed to parse the Roam DB ourselves...
// ----------------------- BEGIN DEPRECATED -----------------------

async function init() {
  console.log("init");

  await loadJS(
    "https://github.com/tonsky/datascript/releases/download/0.18.13/datascript-0.18.13.min.js",
  );
  await loadJS(
    "https://gistcdn.githack.com/jchen1/dd92c2c7d178ad4266d9f335c7ff3d3c/raw/5c48aa9d078b66307f49cd514366e76c61ec9798/transit.js",
  );
  await loadJS(
    "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min.js",
  );

  graph = localStorage.getItem("lastUsedGraph");
  const version = "v10";
  const dbName =
    `roamresearch_com_${version}_SLASH_dbs_SLASH_${graph}-snapshot`;
  const storeName = "keyvaluepairs";

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName);
    request.onerror = (evt) => reject(evt.target.errorCode);

    request.onsuccess = (_) => {
      const db = request.result;
      console.log(`connected to db ${dbName}`);
      const storeRequest = db.transaction(storeName).objectStore(storeName)
        .getAll();
      storeRequest.onerror = (evt) => reject(evt.target.errorCode);
      storeRequest.onsuccess = async (_) => {
        const result = storeRequest.result;
        let done = false;
        result.forEach(async (obj) => {
          if (!done && obj["db-str"]) {
            done = true;
            return resolve({ graph, db: await onDbStr(obj["db-str"]) });
          }
        });
        if (!done) {
          return reject(
            `expected key db-str in results, got ${
              result.map((o) => Object.keys(o))
            }`,
          );
        }
      };
    };
  });
}

function datomFromReader(rep) {
  return { e: rep[0], a: `:${rep[1].v}`, v: rep[2], t: rep[3], added: rep[4] };
}

function mapFromTransitMap(tm) {
  const ret = {};
  tm.forEach((v, k) => {
    const val = (function () {
      if (v.constructor.name === "R") return mapFromTransitMap(v);
      if (v.constructor.name === "L") {
        // hack: need to distinguish between keywords and strings probably
        return `:${v.v}`;
      }
      return v;
    })();
    ret[`:${k.v}`] = val;
  });
  return ret;
}

function dbFromReader(rep) {
  const schema = mapFromTransitMap(rep.l[1]);
  return datascript.init_db(rep.l[3].rep, schema);
}

async function onDbStr(dbStr) {
  console.log(dbStr);
  const reader = transit.reader("json", {
    handlers: {
      "datascript/DB": dbFromReader,
      "datascript/Datom": datomFromReader,
    },
  });
  const db = reader.read(dbStr);

  return db;
}

/*
init().then(data => {
  graph = data.graph;
  db = data.db;
  
  window.removeEventListener("hashchange", onHashChange);
  window.addEventListener("hashchange", onHashChange);
  onHashChange();
});
*/

// ----------------------- END DEPRECATED -----------------------
