import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Link, useIntl, connect, Dispatch } from 'umi';
import { ConnectState } from '@/models/connect';
import React, { useEffect, useState } from 'react';
import styles from './picker_index.less'
import { Button } from 'antd'


const coverPath = "cache/develop_test/cover.png"
let samplePaths = [
  "cache/develop_test/sample-1.png",
  "cache/develop_test/sample-2.png",
  "cache/develop_test/sample-3.png",
  "cache/develop_test/sample-4.png",
  "cache/develop_test/sample-5.png",
]
samplePaths = samplePaths.map((path) => {
  return `myfile:///${path}`
})

const downloadTypes = [
  {
    name: "Right Now",
    priority: 1
  },
  {
    name: "Next Time",
    priority: 20,
  },
  {
    name: "Wait",
    priority: 50,
  },
  {
    name: 'Boring',
    priority: 100
  },
]

type FocusType = {
  currentBox: 'cover_box' | 'sample_box' | 'download_type_box' | 'my_category_box';
  currentIndex: Number;
}
const JavbusPicker = (props: ConnectState) => {
  const {
    dispatch,
  } = props

  function scrollIntoFocus() {
    // 打开页面后的自动聚焦
    setTimeout(() => {
      document.getElementById('picker')?.scrollIntoView({ behavior: 'smooth' })
      dispatch({
        type: 'global/changeLayoutCollapsed',
        payload: true
      });
    }, 500)


  }


  useEffect(() => {
    // 添加键盘监听
    // 关闭上下左右键的翻页
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      )
      {
        event.preventDefault()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    scrollIntoFocus()
    // 删除监听
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch])

  const [currentFocus, setFocus] = useState<FocusType>({
    currentBox: 'cover_box',
    currentIndex: 0
  });

  return (
    <PageHeaderWrapper>
      <Button onClick={() => {
        scrollIntoFocus()
      }} >对齐</Button>
      <div id="picker">
        <div id="cover_box" className={styles.slider}>

        </div>
        <div id="sample_box" className={styles.slider}>
          <div>
            {samplePaths.map((path) => {
              return (
                <img key={path} src={path}></img>
              )
            })}
          </div>
        </div>
        <div id="download_type_box" className={styles.slider}>
          {
            downloadTypes.map((type,index)=>{
              return (
                <Button onClick={()=>{
                  let type_weight = type.priority;
                }}>{type.name}</Button>
              )
            })
          }
        </div>
        <div id="my_category_box" className={styles.slider}>

        </div>
      </div>
    </PageHeaderWrapper>
  )

}

export default connect(({ global, settings }: ConnectState) => ({
  collapsed: global.collapsed,
  settings,
}))(JavbusPicker)
