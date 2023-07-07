import './style.css';

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Wiki Serch</h1>
    <div class="card">
      <div class="wikipedia__search">
        <input id="wikipedia__serch--input" type="text" value="" placeholder="検索ワード">
        <button id="js-wikipedia__serch--button" type="button">検索</button>
      </div>
      <div class="wikipedia__results></div>
    </div>
  </div>
`;
