import React from './chiujs'

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            age: 18
        }
    }

    handleClick = () => {
        this.setState({
            age: this.state.age + 1
        })
    }

    render() {
        return <div>
            <h1>{this.state.age} years old</h1>
            <button onClick={this.handleClick}>+</button>
        </div>
    }
}

export default React.transfer(App)