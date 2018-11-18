import ReactDOM from 'react-dom';

export default renderPage;

function renderPage(reactElement) {
  let container = document.querySelector('body > div');
  if( ! container ) {
    container = document.body.appendChild(document.createElement('div'));
  }
  ReactDOM.render(
    reactElement,
    container
  );
}
