# JavaScript-Deobfuscator

JavaScript-Deobfuscator 是我围绕 JavaScript 逆向分析与解混淆场景持续整理的一个项目。当前版本主要聚焦两条核心能力：

- `ChaosVM` 风格虚拟机代码反汇编（Disassembly）
- `while + switch(pc)` 控制流平坦化代码的节点合并与结构化还原（Control-Flow Node Merge）

项目当前以在线工具、算法说明文档和输入输出样例的形式提供能力，便于直接使用、复现分析过程，以及在此基础上继续扩展工程化实现。

在线工具：<https://pyapi.tk/>

核心文档：

- [ChaosVM_反汇编分析.md](./ChaosVM_反汇编分析.md)
- [控制流节点合并说明文档.md](./控制流节点合并说明文档.md)

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [项目结构](#项目结构)
- [功能模块](#功能模块)
- [依赖关系](#依赖关系)
- [运行原理](#运行原理)
- [快速开始](#快速开始)
- [API 接口文档](#api-接口文档)
- [已知限制](#已知限制)
- [联系方式](#联系方式)

## 项目简介

这个项目的目标不是做一个泛化到所有场景的一键式解混淆器，而是围绕我在实际分析过程中最常处理的两类问题，沉淀出清晰、可复用、可扩展的方法：

1. 对 `ChaosVM` 类 JavaScript 虚拟机样本做指令级反汇编，输出更适合人工审计的中间表示。
2. 对被平坦化为 `switch(pc)` 的控制流进行节点分类、伪分支处理和递归合并，恢复出更接近原始业务逻辑的结构化代码。

在在线工具中，我把能力入口保持为两个模式：

- `反汇编`
- `控制流节点合并`

这两个模式分别对应仓库中的两条分析链路，以及两篇核心文档：

- [ChaosVM_反汇编分析.md](./ChaosVM_反汇编分析.md)
- [控制流节点合并说明文档.md](./控制流节点合并说明文档.md)

## 核心特性

### 1. ChaosVM 反汇编

- 将 VM 驱动执行逻辑还原为可读的伪汇编文本
- 输出 `FUNC`、`LABEL`、`TRY/CATCH`、`Closure`、寄存器等关键逆向信息
- 便于继续做指令语义归类、流程梳理和函数职责定位
- 当前提供 `MD5`、`SHA1`、`SM3` 三组样例输入输出

### 2. 控制流节点合并

- 针对 `while(1) + switch(next|pc)` 平坦化结构做恢复
- 支持单向节点、分支节点、终止节点的分类与递归合并
- 能处理 `continue`、`break`、循环回边、共同后继、伪分支、游离节点等场景
- 输出更接近人工可读的 `if`、`if/else`、`while`、`return` 结构

### 3. 文档与样例同步

- 通过专门文档记录算法和指令语义，而不是只给结果
- 通过 `demo-chaosVM` 和 `demo-ControlFlowDeobfuscation` 提供输入输出对照样例
- 文档中包含 Mermaid 图，便于理解整体流程和节点合并规则

### 4. 在线使用便捷

在线工具提供以下交互能力：

- 模式切换
- 粘贴代码
- 一键开始解混淆
- 清空内容
- 复制结果

## 项目结构

```text
JavaScript-Deobfuscator/
 README.md
 ChaosVM_反汇编分析.md
 控制流节点合并说明文档.md
 demo-chaosVM/
   input_md5.js
   input_sha1.js
   input_sm3.js
   output_md5.txt
   output_sha1.txt
   output_sm3.txt
 demo-ControlFlowDeobfuscation/
    input_md5.js
    input_sha1.js
    input_while_break_continue.js
    output_md5.js
    output_sha1.js
    output_while_break_continue.js
```

### 目录说明

| 路径 | 类型 | 说明 |
| --- | --- | --- |
| `README.md` | 文档 | 项目总览、使用说明与开发说明 |
| [ChaosVM_反汇编分析.md](./ChaosVM_反汇编分析.md) | 核心文档 | 记录 ChaosVM 指令语义与反汇编分析方式 |
| [控制流节点合并说明文档.md](./控制流节点合并说明文档.md) | 核心文档 | 记录控制流节点分类、伪分支处理与合并规则 |
| `demo-chaosVM/` | 样例目录 | VM 输入样例与反汇编输出结果 |
| `demo-ControlFlowDeobfuscation/` | 样例目录 | 平坦化控制流输入样例与结构化输出结果 |

## 功能模块

当前版本可以按以下模块来理解。

### 1. 输入接收模块

负责接收待分析的 JavaScript 代码文本，并与模式选择联动。

### 2. 模式分发模块

根据选择的模式将输入分发到不同分析链路：

- `反汇编` -> ChaosVM 反汇编链路
- `控制流节点合并` -> 平坦化控制流恢复链路

### 3. ChaosVM 指令分析模块

该模块围绕 [ChaosVM_反汇编分析.md](./ChaosVM_反汇编分析.md) 中总结的指令模板工作，负责识别并还原：

- 寄存器读写
- 函数调用：`CALL`、`APPLY`
- 对象操作：`GET`、`SET`、`DELETE`
- 控制流操作：`JUMP`、`JUMP_IF_ELSE`、`RETURN`、`THROW`
- 常量装载：`NUMBER`、`STRING`、`NULL`、`TRUE`、`FALSE`、`UNDEF`
- 运行时辅助结构：`FUNC`、`GET_FUNC`、`SET_FUNC`、`PUSH_PC`、`POP_PC`

### 4. 伪汇编生成模块

把 VM 的执行逻辑输出为更适合人工分析的文本表示，典型元素包括：

- `FUNC_xxx`
- `LABEL_xxx`
- `TRY_xxx`、`CATCH_xxx`
- `r0 ~ rn` 寄存器
- `Closure[]`、`arguments[]`、`currentFunc`

### 5. 控制流预处理模块

围绕 [控制流节点合并说明文档.md](./控制流节点合并说明文档.md) 中的规则，对输入做统一化处理：

1. 将分发逻辑规整为 `switch(pc)` 形式
2. 统一补齐 `case` 末尾的 `break`
3. 将退出驱动循环的语义尽量归一到 `return`

### 6. 节点分类模块

将 `case` 严格划分为：

- 单向节点（One-way Node）
- 分支节点（Branching Node）
- 终止节点（Terminal Node）

### 7. 伪分支与游离节点处理模块

结合静态分析和动态分析思路，对平坦化流程中的噪音做清理：

- 识别恒真或恒假的伪分支
- 采样执行路径，减少误判
- 删除永远不会进入的游离节点

### 8. 递归合并模块

按照规则持续合并节点，直到输出稳定结构：

- 单向节点合并
- 分支节点合并
- 回边转换为循环
- 共同后继转换为 `if/else`

## 依赖关系

### 运行时依赖

当前版本以文档、样例和在线工具为主，阅读和使用门槛较低。常见依赖主要来自 JavaScript 语义本身：

| 层级 | 依赖 | 说明 |
| --- | --- | --- |
| 文档层 | Markdown / Mermaid | 用于展示分析文档和流程图 |
| 在线使用层 | 浏览器 JavaScript 运行环境 | 在线工具在浏览器中使用 |
| 样例验证层 | Node.js 或现代浏览器控制台 | 用于执行或检查输出样例 |

### 模块依赖关系

```text
输入代码
  -> 模式选择
     -> 反汇编链路
        -> 指令识别
        -> 伪汇编生成
        -> 文本输出
     -> 控制流节点合并链路
        -> 预处理
        -> 节点分类
        -> 伪分支处理
        -> 删除游离节点
        -> 递归合并
        -> 结构化代码输出
```

## 运行原理

### 1. ChaosVM 反汇编原理

`demo-chaosVM` 中的输入样例体现了这类目标代码的典型特征：

- 存在 VM 入口函数
- 使用数组或整数序列承载字节码
- 使用 `switch(opcode)` 或类似分发表驱动执行
- 使用寄存器数组、闭包数组和 `PC` 管理状态

整体处理流程如下：

1. 提取 VM 调度入口与字节码容器
2. 对字节码进行解码、展开或重建
3. 按 opcode 模板匹配具体语义
4. 将寄存器操作重写为伪汇编文本
5. 输出标签、跳转、异常块、闭包与函数信息

这里的目标不是直接生成美化后源码，而是先生成一层适合人工阅读、继续分析和继续重构的中间表示。

### 2. 控制流节点合并原理

控制流恢复链路分为以下几个阶段：

1. 将平坦化逻辑统一规整为 `switch(pc)` 结构
2. 对每个 `case` 做节点类型识别
3. 折叠伪分支，删除不可达节点
4. 递归合并相邻节点
5. 将图结构逐步还原为 `if`、`if/else`、`while`
6. 最终输出结构化代码

该链路特别适合处理以状态机方式平坦化的 JavaScript 代码。

## 快速开始

### 方式：直接使用在线工具

1. 打开 <https://pyapi.tk/>
2. 粘贴待分析的 JavaScript 代码
3. 选择 `反汇编` 或 `控制流节点合并`
4. 点击开始解混淆
5. 复制输出结果，结合仓库中的样例与文档继续分析


推荐阅读顺序：

1. [控制流节点合并说明文档.md](./控制流节点合并说明文档.md)
2. [ChaosVM_反汇编分析.md](./ChaosVM_反汇编分析.md)
3. `demo-ControlFlowDeobfuscation/`
4. `demo-chaosVM/`

## API 接口文档

### 1. Web UI

在线入口：<https://pyapi.tk/>

#### 模式 A：`反汇编`

输入：

- 包含 VM 调度逻辑的 JavaScript 代码
- 常见特征包括字节码数组、寄存器数组、闭包、跳转标签、`switch` 驱动执行器

输出：

- 伪汇编文本
- 包含 `FUNC_xxx`、`LABEL_xxx`、`TRY/CATCH`、`Closure[]`、`r0 ~ rn`

#### 模式 B：`控制流节点合并`

输入：

- 被平坦化为 `while + switch(pc|next)` 的 JavaScript 代码
- 每个 `case` 通过 `pc = 常量` 或 `pc = 条件 ? a : b` 控制流转移

输出：

- 更接近原始结构的 JavaScript 代码
- 典型结构包括 `if`、`if/else`、`while`、`return`

## 已知限制

1. 当前版本主要围绕文档、样例和在线工具展开，完整工程化实现仍可继续扩展。
2. 控制流节点合并针对的是较典型的 `switch(pc)` 平坦化结构，更复杂的变体需要按样本继续增强规则。
3. ChaosVM 反汇编输出是面向人工分析的中间表示，不直接等价于最终源码恢复结果。
4. 伪分支识别和动态采样仍然依赖样本特征与运行环境。
5. 对极端大样本或高度变种样本，后续仍需继续补充策略与测试数据。

## 联系方式

- 项目仓库：<https://github.com/jsCrack8/JavaScript-Deobfuscator>
- 作者主页：<https://github.com/jsCrack8>
- 在线工具：<https://pyapi.tk/>
- 问题反馈：<https://github.com/jsCrack8/JavaScript-Deobfuscator/issues>
