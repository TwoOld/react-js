/**
 * 
 * @param {str|function} 类型，是字符串div 还是函数 
 * @param {*} jsx传递的属性 
 * @param  {...any} 子元素 
 */
function createElement(type, props, ...children) {
    delete props.__source
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                    ? child
                    : createTextElement(child)
            ),
        },
    }
}
/** 文本类型vdom创建 */
function createTextElement(text) {
    return {
        type: "TEXT",
        props: {
            nodeValue: text,
            children: [],
        },
    }
}
/** 创建dom， 根据vdom or fiber */
function createDom(vdom) {
    const dom = vdom.type == "TEXT"
        ? document.createTextNode("")
        : document.createElement(vdom.type)

    updateDom(dom, {}, vdom.props)
    // 设置属性

    return dom
    // // 递归渲染子元素
    // vdom.props.children.forEach(child => render(child, dom))
    // container.appendChild(dom)
}

// dom更新
function updateDom(dom, prevProps, nextProps) {
    Object.keys(prevProps)
        .filter(name => name !== "children")
        .filter(name => !(name in nextProps))
        .forEach(name => {
            // 删除
            if (name.slice(0, 2) == 'on') {
                dom.removeEventListener(name.slice(2).toLowerCase(), prevProps[name], false)
            } else {
                dom[name] = ''
            }
        })

    Object.keys(nextProps)
        .filter(name => name !== "children")
        .forEach(name => {
            // 删除
            if (name.slice(0, 2) == 'on') {
                dom.addEventListener(name.slice(2).toLowerCase(), nextProps[name], false)
            } else {
                dom[name] = nextProps[name]
            }
        })

}


function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    // 取消wip
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }
    // const domParent = fiber.parent.dom


    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if (
        fiber.effectTag === "PLACEMENT" &&
        fiber.dom != null
    ) {
        domParent.appendChild(fiber.dom)
    } else if (
        fiber.effectTag === "UPDATE" &&
        fiber.dom != null
    ) {
        updateDom(
            fiber.dom,
            fiber.base.props,
            fiber.props
        )

    } else if (fiber.effectTag === "DELETION") {
        // domParent.removeChild(fiber.dom)
        commitDeletion(fiber, domParent)
    }
    // domParent.appendChild(fiber.dom)
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}
function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

function render(vdom, container) {
    // 设置全局 nextUnitOfWork 
    wipRoot = {
        dom: container,
        props: {
            children: [vdom],
        },
        base: currentRoot,
    }
    deletions = []
    nextUnitOfWork = wipRoot
}


let nextUnitOfWork = null
// 工作中的fiber
let wipRoot = null
let currentRoot = null
let deletions = null
// 任务调度
function workLoop(deadline) {
    // 有任务，并且当前帧还没结束
    // 没考虑到超时( deadline.didTimeout
    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        // 获取下一个任务单元
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
    }
    // 没有下个任务了 提交修改
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)
function performUnitOfWork(fiber) {
    // TODO add dom node
    // TODO create new fibers
    // TODO return next unit of work

    // 如果没有dom 就不是入口，直接创建dom
    // if (!fiber.dom) {
    //   fiber.dom = createDom(fiber)
    // }
    // fiber父元素 这里先去掉直接操作dom的

    // 子元素遍历， 把children数组，变成链表
    // const elements = fiber.props.children
    // reconcileChildren(fiber, elements)


    // fiber遍历顺序
    // 子 =》 子的兄弟 => 没有兄弟了=> 父元素

    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

function useState(init) {
    const oldHook =
        wipFiber.base &&
        wipFiber.base.hooks &&
        wipFiber.base.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : init,
        queue: [],
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action
    })
    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            base: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []

    // 执行函数，传入props
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}
function reconcileChildren(wipFiber, elements) {
    let index = 0
    let oldFiber =
        wipFiber.base && wipFiber.base.child
    let prevSibling = null
    while (
        index < elements.length ||
        oldFiber != null
    ) {
        const element = elements[index]
        let newFiber = null
        // 对比
        const sameType =
            oldFiber &&
            element &&
            element.type === oldFiber.type
        if (sameType) {
            // update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                base: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            // add this node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                base: null,
                effectTag: "PLACEMENT",
            }
        }
        if (oldFiber && !sameType) {
            // delete the oldFiber's node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if (index === 0) {
            wipFiber.child = newFiber
        } else if (element) {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber
        index++
    }
}

class Component {
    constructor(props) {
        this.props = props
        // this.state = {}
    }
}
function transfer(Component) {
    return function (props) {
        const component = new Component(props)
        // 简单的规避eslitn
        let initState = useState
        let [state, setState] = initState(component.state)
        component.props = props
        component.state = state
        component.setState = setState
        console.log(component)
        return component.render()
    }
}
export default {
    createElement,
    render,
    useState,
    Component,
    transfer
}