import './style.css';

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Wiki Serch</h1>
    
    <div class="wikipedia__search">
      <input id="wikipedia__serch--input" type="text" value="" placeholder="検索ワード">
      <button id="wikipedia__serch--button" type="button">検索</button>
    </div>
    <div id="card">
      <div class="wikipedia__results></div>
      <div class="p-wikipedia__body" id="js-wikipedia-body"></div>
    </div>
  </div>
`;
(() => {
 
  const wikiInput = document.getElementById("wikipedia__serch--input"); //input部分
  const wikiButton = document.getElementById("wikipedia__serch--button"); //button部分
  const wikiBody = document.getElementById("card"); //表示させるエリア

  const wikiFetch = async (inputValue) => { //asyncで非同期処理だと宣言する
    const fetchValue = fetch(`https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=45&srsearch=${inputValue}`, {
      method: "GET"
    })
      .then((value) => {
        return value.json(); //wikipediaからのデータをJSON形式に変換
      })
      .catch(() => {
        alert("wikipediaにうまくアクセスできないようです、、");
      });

    const valueJson = await fetchValue; //非同期処理を実行
    const valueTargets = valueJson.query.search; //必要な情報が入っている配列を取得

    if (!valueTargets.length) {
      const wikiNull = document.createElement("p");
      wikiNull.classList.add("p-wikipedia__null");
      wikiNull.textContent = "検索したワードはヒットしませんでした。";
      wikiBody.appendChild(wikiNull);
    } else {
      const element = document.getElementById("card");
      for (const elem of valueTargets) {
        const elemDate = elem.timestamp;
        const elemDateSlice = elemDate.slice(0, 10).replace(/-/g, ".");
        element.insertAdjacentHTML('beforeend',
        `
          <div class="wikicard">
            <a href="http://jp.wikipedia.org/?curid=${elem.pageid}" target="_blank">
            <h3 class="wikicard__title">${elem.title}
            </h3>
            <div class="wikicard__date">
            最終更新日：${elemDateSlice}
            </div>
            </a>
            
        </div>
          `
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