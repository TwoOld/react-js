// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './chiujs'
import App1 from './App'
let ReactDOM = React

function App(props) {
    const [count, setCount] = React.useState(1)
    return <div>
        <h1 id="app">{props.title} {count}</h1>
        <button onClick={() => setCount(count + 1)}>+</button>
        <p>React</p>
        <a href="http://www.kaikeba.com">跳转</a>
        <hr />
        <App1 />
    </div>
}
let element = <App title="Chiu" />
ReactDOM.render(element, document.getElementById('root'))
