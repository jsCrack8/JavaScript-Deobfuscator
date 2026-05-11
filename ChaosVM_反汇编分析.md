# ChaosVM 反汇编分析

## 预处理说明（先解 ob，再做反汇编）

在进入本篇的指令级反汇编分析前，建议先判断 `jsvmp` 样本是否叠加了 `ob`（如 `javascript-obfuscator`）混淆。  
如果存在 `ob` 混淆，请先做第一步反混淆，再进行后续 ChaosVM 分析，否则会显著增加指令定位和语义还原难度。

### 推荐预处理流程

1. 将原始 `jsvmp` 代码粘贴到 `webcrack`：<https://webcrack.netlify.app/>
2. 执行第一步反混淆，输出初步可读代码（变量名、结构、字符串等会更清晰）
3. 对预处理结果做快速检查，确认核心 VM 结构仍可识别，例如：
   - 调度入口函数
   - 字节码数组或编码载体
   - `switch(opcode)` / 分发表执行逻辑
4. 以预处理后的代码作为本篇分析输入，继续做指令语义映射与反汇编输出

### 适用场景说明

- 如果样本本身仅是 VM 壳且没有额外 `ob`，可直接进入本篇指令分析。
- 如果样本同时包含 `ob` + VM 双层混淆，建议严格按“先 webcrack，后反汇编”顺序处理。


### 1. SHIFT 指令

```js
n = m[k[++l]];
if (m[k[++l]] = !!n.length) m[k[++l]] = n.shift(); else ++l;
```

语义：从数组头部弹出一个元素；同时把“是否还有剩余元素”的布尔值写入一个槽位。

### 2. FORIN 指令

```js
n = [];
for (o in m[k[++l]]) n.push(o);
m[k[++l]] = n;
```

语义：枚举对象的可枚举键，收集成数组。

### 3. FUNC 指令

```js
n = [];
for (o = k[++l]; o > 0; o--) n.push(m[k[++l]]);
m[k[++l]] = c(l + k[++l], n, f, i, j);
try {
    Object.defineProperty(m[k[l - 1]], "length", {
        value: k[++l],
        configurable: true,
        writable: false,
        enumerable: false
    })
} catch (v) {
}
```

语义：构造一个新的 VM 子函数/闭包，把若干寄存器作为捕获变量传入，并尝试修正生成函数的 `length`。

### 4. GET_FUNC 指令

```js
m = l[j[++k]], n = l[j[++k]], p = Object.getOwnPropertyDescriptor(m, n) || {
    configurable: true,
    enumerable: true
};
p.get = l[j[++k]];
Object.defineProperty(m, n, p);
```

语义：为对象属性定义 getter。

### 5. SET_FUNC 指令

```js
m = l[j[++k]], n = l[j[++k]], p = Object.getOwnPropertyDescriptor(m, n) || {
    configurable: true,
    enumerable: true
};
p.set = l[j[++k]];
Object.defineProperty(m, n, p);
```

语义：为对象属性定义 setter。

### 6. PUSH_PC 指令

```js
q.push(l + k[++l]); // 保存pc跳转值
```

语义：把一个未来的跳转地址压栈，通常用于异常流或延迟恢复点。

### 7. POP_PC 指令

```js
q.pop(); // 弹出保存的pc
```

语义：弹出最近一次保存的 PC。

### 8. NEW_BIND 指令

```js
n = [,];
for (o = k[++l]; o > 0; o--) n.push(m[k[++l]]);
o = k[++l];
r = m[k[++l]];
m[o] = new (r.bind.apply(r, n));
```

语义：先做 `bind`，再通过 `new` 调用构造函数。

### 9. NEW 指令

```js
m[k[++l]] = new m[k[++l]];
m[k[++l]] = new m[k[++l]](m[k[++l]]);
m[k[++l]] = new m[k[++l]](m[k[++l]], m[k[++l]]);
m[k[++l]] = new m[k[++l]](m[k[++l]], m[k[++l]], m[k[++l]]);
```

语义：构造调用，支持 0 到 3 个参数的展开形式。

### 10. 二项式运算指令

```js
m[k[++l]] = m[k[++l]] << m[k[++l]]; // 算术运算，比较运算，位运算 instanceof等
m[k[++l]] = k[++l] + m[k[++l]]; // 算术运算，比较运算，位运算 instanceof等
m[k[++l]] = m[k[++l]] + k[++l]; // 算术运算，比较运算，位运算 instanceof等
```

语义：这是一个“运算族”模板，实际可覆盖：

- 算术：`+ - * / %`
- 比较：`> < >= <= == ===`
- 位运算：`& | ^ << >> >>> ~`
- 其他：`in`、`instanceof`

### 11. IN 指令

```js
m[k[++l]] = m[k[++l]] in m[k[++l]];// in 指令
```

语义：执行 `in` 判断。

### 12. INSTANCEOF 指令

```js
m[k[++l]] = a(m[k[++l]], m[k[++l]]);// instanceof 指令, 根据a函数来判断
```

语义：执行 `instanceof` 逻辑。

### 13. CALL 指令

```js
m[k[++l]] = m[k[++l]].call(p);// p为void 0
m[k[++l]] = m[k[++l]].call(p, m[k[++l]]);
m[k[++l]] = m[k[++l]].call(p, m[k[++l]], m[k[++l]]);
m[k[++l]] = m[k[++l]].call(m[k[++l]]);
m[k[++l]] = m[k[++l]].call(m[k[++l]], m[k[++l]]);
m[k[++l]] = m[k[++l]].call(m[k[++l]], m[k[++l]], m[k[++l]]);
m[k[++l]] = m[k[++l]].call(m[k[++l]], m[k[++l]], m[k[++l]], m[k[++l]]);
```

语义：函数调用模板，覆盖：

- `this = void 0`
- `this = 某寄存器`
- 0 到 3 个显式参数

### 14. APPLY 指令

```js
n = [];
for (o = k[++l]; o > 0; o--) n.push(m[k[++l]]);
m[k[++l]] = m[k[++l]].apply(m[k[++l]], n);
```

语义：把参数数组组装出来，再走 `.apply(thisArg, args)`。

### 15. SET 指令

```js
m[k[++l]][m[k[++l]]] = m[k[++l]];
m[k[++l]][k[++l]] = m[k[++l]];
```

语义：对象属性写入，支持：

- 动态键：`obj[keyReg] = value`
- 立即数/常量键：`obj[imm] = value`

### 16. GET 指令

```js
m[k[++l]] = m[k[++l]][k[++l]];
m[k[++l]] = m[k[++l]][m[k[++l]]];
```

语义：对象属性读取，支持：

- 常量键读取
- 动态键读取

### 17. MOV 指令

```js
m[k[++l]] = m[k[++l]];
```

语义：寄存器复制。

### 18. 一元运算指令

```js
m[k[++l]] = -m[k[++l]];// + - ~ ! typeof delete等
```

语义：一元操作模板，实际可承载 `-`、`+`、`~`、`!` 等。

### 19. DELETE 指令

```js
m[k[++l]] = delete m[k[++l]][m[k[++l]]];
```

语义：删除对象属性。

### 20. TYPEOF 指令

```js
m[k[++l]] = b(m[k[++l]]);// 根据b函数可以看出
```

语义：执行 `typeof`，通常用辅助函数兼容 `symbol` 等边界。

### 21. JUMP 指令

```js
l += k[++l];// 无条件跳转
```

语义：无条件修改 PC。

### 22. JUMP_IF_ELSE 指令

```js
l += m[k[++l]] ? k[++l] : k[++l, ++l]; // 条件跳转指令
```

语义：按某个条件槽位执行条件跳转。

### 23. NUM() 指令

```js
m[k[++l]] = m[k[++l]] - 0; // 强制转换为数值
```

语义：通过减 `0` 完成数值化。

### 24. BIGINT 指令

```js
m[k[++l]] = typeof m[k[l + 1]] == "bigint" ? m[k[++l]] : m[k[++l]] - 0;
```

语义：如果参与值不是 `bigint`，则走普通数值化。

### 25. NUMBER 指令

```js
m[k[++l]] = k[++l]; // 加载数值常量
```

语义：把立即数写入寄存器。

### 26. STRING 指令

```js
m[k[++l]] = "";// 加载空字符串
```

语义：初始化空字符串。

### 27. APPEND_STRING 指令

```js
m[k[++l]] += String.fromCharCode(k[++l]);// 累加字符串
```

语义：追加一个字符，常用于逐字节拼接字符串常量。

### 28. ERROR 指令

```js
m[k[++l]] = t; // error对象
```

语义：把当前异常对象写入寄存器。

### 29. UNDEF 指令

```js
m[k[++l]] = p; // 加载void 0;
```

语义：加载 `undefined`。

### 30. NULL 指令

```js
m[k[++l]] = null;
```

语义：加载 `null`。

### 31. FALSE 指令

```js
m[k[++l]] = false;
```

语义：加载 `false`。

### 32. TRUE 指令

```js
m[k[++l]] = true;
```

语义：加载 `true`。

### 33. OBJ 指令

```js
m[k[++l]] = {}; // 加载空对象
```

语义：创建空对象。

### 34. Array 指令

```js
m[k[++l]] = Array(k[++l]); // 加载数组
```

语义：按长度创建数组。

### 35. DEC 指令

```js
m[k[++l]] = --m[k[++l]];// -- 自减指令
```

语义：前置自减。

### 36. INC 指令

```js
m[k[++l]] = ++m[k[++l]];// ++ 自增指令
```

语义：前置自增。

### 37. THROW 指令

```js
throw m[k[++l]]; // throw 抛错
```

语义：抛出异常。

### 38. RETURN 指令

```js
return m[k[++l]]; // return
```

语义：返回寄存器值。


