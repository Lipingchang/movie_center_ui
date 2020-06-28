import React from 'react';
type indexType = Array<string>;

/**
 * 为了防止超过localStorage的5MB限制
 * 用key作为 索引 存储其他的下标
 * @param key 此组件用到的localstorage的下标名称
 */
export function loadAndSave(key: string) {
  //TODO 计算大小 localStorage 限制5MB
  const rawIndex = localStorage.getItem(key);
  let load = {};
  if (!rawIndex) {
    const index: indexType = JSON.parse(rawIndex);
    let str = '';
    index.forEach((key) => {});
  }

  return {
    callback: () => {},
    load,
  };
}

/**
     * 计算字符串所占的内存字节数，默认使用UTF-8的编码方式计算，也可制定为UTF-16
     * UTF-8 是一种可变长度的 Unicode 编码格式，使用一至四个字节为每个字符编码
     * 
     * 000000 - 00007F(128个代码)      0zzzzzzz(00-7F)                             一个字节
     * 000080 - 0007FF(1920个代码)     110yyyyy(C0-DF) 10zzzzzz(80-BF)             两个字节
     * 000800 - 00D7FF 
       00E000 - 00FFFF(61440个代码)    1110xxxx(E0-EF) 10yyyyyy 10zzzzzz           三个字节
     * 010000 - 10FFFF(1048576个代码)  11110www(F0-F7) 10xxxxxx 10yyyyyy 10zzzzzz  四个字节
     * 
     * 注: Unicode在范围 D800-DFFF 中不存在任何字符
     * {@link http://zh.wikipedia.org/wiki/UTF-8}
     * 
     * UTF-16 大部分使用两个字节编码，编码超出 65535 的使用四个字节
     * 000000 - 00FFFF  两个字节
     * 010000 - 10FFFF  四个字节
     * 
     * {@link http://zh.wikipedia.org/wiki/UTF-16}
     * @param  {String} str 
     * @param  {String} charset utf-8, utf-16
     * @return {Number}
     */
const sizeof = function (str: string, charset: 'utf-16' | 'utf16') {
  let total = 0,
    charCode,
    i,
    len;
  const c = charset ? charset.toLowerCase() : '';
  if (c === 'utf-16' || c === 'utf16') {
    for (i = 0, len = str.length; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode <= 0xffff) {
        total += 2;
      } else {
        total += 4;
      }
    }
  } else {
    for (i = 0, len = str.length; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode <= 0x007f) {
        total += 1;
      } else if (charCode <= 0x07ff) {
        total += 2;
      } else if (charCode <= 0xffff) {
        total += 3;
      } else {
        total += 4;
      }
    }
  }
  return total;
};

// 需要指定保存到 localStorage中的key
export type PresistClassStateType = {
  storageKey: string;
};

/**
 * 有一些辅助方法帮助 对象持久化
 */
export class PresistClass<
  P = {},
  S extends PresistClassStateType = { storageKey: string }
> extends React.Component<P, S> {
  constructor(props: P) {
    super(props);
  }

  /**
   * 从localStorage中载入本类的缓存
   */
  loadStateFromCache() {
    const storageKey = this.state.storageKey;
    const str = window.localStorage.getItem(storageKey);
    let obj;
    try {
      obj = JSON.parse(str || '{}');
    } catch (e) {
      console.error(e);
      return null;
    }
    delete obj[storageKey];
    return obj;
  }

  // 从obj中拿出 schema有的属性, 浅拷贝
  extractValues(obj: any, schema: any) {
    const keys = Object.keys(obj);
    const schemaKeys = Object.keys(schema);
    const ret = {};
    for (let key of keys) {
      if (schemaKeys.includes(key)) {
        ret[key] = obj[key];
      }
    }
    return ret;
  }

  /**
   * 把state和附加内容保存到localStorage中
   * @param extra 附加保存内容
   */
  saveStateToCache(extra: any) {
    const strongKey = this.state.storageKey;
    window.localStorage.setItem(strongKey, JSON.stringify({ ...this.state, ...extra }));
  }
}
/**
 * 例子:
 * 
  constructor(props: PropsType) {
    super(props);
    // 取出
    this.storage = this.loadStateFromCache();
    this.state = {
     ...this.state,
     // 只拿出需要的
     ...this.extractValues(this.storage,this.state), 
    }
  }

  componentDidMount() {
    // formRef 在挂载后 才能读取
    const schema = this.formRef.current?.getFieldsValue()
    // 根据 formRef 的字段内容 拿出需要的字段
    this.formRef.current?.setFieldsValue({
      ...this.extractValues(this.storage, schema)
    })
  }
  
  componentWillUnmount(){
    // 保存所有的state 和form的附加内容
    this.saveStateToCache(this.formRef.current?.getFieldsValue());
  }
 * 
 */
