import "./style.css";

document.querySelector("#app").innerHTML = `
  <div>
    <h1>Wiki Search</h1>
    <div class="wikipedia__search">
      <input id="wikipedia__search--input" type="text" value="" placeholder="検索ワード">
      <button id="wikipedia__search--button" type="button">検索</button>
    </div>
    <div id="card">
      <div class="wikipedia__results></div>
      <div class="p-wikipedia__body" id="js-wikipedia-body"></div>
    </div>
  </div>
`;
(() => {
  const wikiInput = document.getElementById("wikipedia__search--input"); //input部分
  const wikiButton = document.getElementById("wikipedia__search--button"); //button部分
  const wikiBody = document.getElementById("card"); //表示させるエリア

  const wikiFetch = async (inputValue) => {
    //asyncで非同期処理だと宣言する
    const fetchValue = fetch(
      `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=45&srsearch=${inputValue}`,
      {
        method: "GET",
      },
    )
      .then((value) => {
        return value.json(); //wikipediaからのデータをJSON形式に変換
      })
      .catch(() => {
        alert("wikipediaにうまくアクセスできないようです、、");
      });

    const valueJson = await fetchValue; //非同期処理を実行
    const valueTargets = valueJson.query.search; //必要な情報が入っている配列を取得
    const element = document.getElementById("card");

    if (!valueTargets.length) {
      element.insertAdjacentHTML(
        "beforeend",
        `
          <p>検索したワードはヒットしませんでした。</p>
          `,
      );
    } else {
      for (const elem of valueTargets) {
        const elemDate = elem.timestamp;
        const snippet = elem.snippet.slice(0, 200);
        const elemDateSlice = elemDate.slice(0, 10).replace(/-/g, ".");
        element.insertAdjacentHTML(
          "beforeend",
          `
          <div class="wikicard">
            <a href="http://jp.wikipedia.org/?curid=${elem.pageid}" target="_blank">
            <h2 class="wikicard__title">${elem.title}
            </h2>
            <p>${snippet}...</p>
            <div class="wikicard__date">
            最終更新日：${elemDateSlice}
            </div>
            </a>
            
        </div>
          `,
        );
      }
    }
  };

  //クリックイベントに設定している関数
  const wikiData = () => {
    wikiBody.innerHTML = ""; //一旦js-wikipedia-bodyの中を空にする
    const inputValue = wikiInput.value; //Input要素に入力されたテキストを取得
    wikiFetch(inputValue);
  };

  wikiButton.addEventListener("click", wikiData, false);
})();
