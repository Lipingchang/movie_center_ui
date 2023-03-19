import React, { useReducer, useEffect, useState, useRef } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { fuzzyQueryIdolName, idolMovieType, loadIdolMoviesByPage, setJavbusMovieDownloading } from '@/utils/DiskScanDB/dao';
import { AutoComplete, Button, Input, List, Typography, Modal, Carousel, Card, Space, Tooltip, message} from 'antd'
import { PlaySquareOutlined, CloudDownloadOutlined} from '@ant-design/icons';
import { JavbusIdolType } from '@/utils/DiskScanDB/bean'
const electron = window.require('electron')
import fakeFs from 'fs'
const fs: typeof fakeFs = window.require('fs')
import fakePath from 'path'
const path: typeof fakePath = window.require('path')
import fakeChildProcess from 'child_process'
const child_process: typeof fakeChildProcess = window.require('child_process')
import styles from './IdolList.less'
import FuzzySearchFileCard from '../DiskScan/FuzzySearchFile'
import moment from 'moment';
const DefaultPageSize = 20


type Props = {
  idolDetail: JavbusIdolType | undefined
} & ConnectState;
function IdolMovieQuery(props: Props) {
  const [movieList, setMovieList] = useState<Array<idolMovieType> | []>([])
  const [movieListTotal, setMovieListTotal] = useState<number>(0)
  const [movieListLoading, setMovieListLoading] = useState<boolean>(false)
  const [isShowMoviePicOpen, setShowPic] = useState<boolean>(false)
  const [showMoviePicList, setShowPicList] = useState<Array<any>>([])
  const [fuzzySearchStr, setFuzzySearch] = useState<string>("")
  const [showFuzzySearchBox, setVisiableFuzzySearch] = useState<number>(-1);  // 延迟关闭 timeout返回
  const sliderRef = useRef<any>(null)

  function goPage(idolName: string, pageNum: number, pageSize: number) {
    setMovieListLoading(true)
    loadIdolMoviesByPage(idolName,pageSize, pageNum )
    .then((_data) => {
      console.log(_data) // 数据格式
      setMovieList(_data.docs)
      setMovieListTotal(_data.pageinfo.total)
    })
    .finally(()=>{
      setMovieListLoading(false)
    })
  }

  useEffect(()=>{
    // goPage('桃乃木かな', 4, 5)
    if (props.idolDetail) {
      goPage(props.idolDetail.name, 1, DefaultPageSize)
    }
  }, [props.idolDetail?.name])

  let List_Content = null
  if (props.idolDetail===undefined) {
  // if (false) {
    List_Content = <div>None..</div>
  } else {
    let idol_name = props.idolDetail.name
    List_Content = 
      <List
        loading={movieListLoading}
        dataSource={movieList}
        pagination={{
          onChange: (pageNum: number, pageSize?: number) => {
            goPage(idol_name, pageNum, pageSize !== undefined ? pageSize : DefaultPageSize)
          },
          total: movieListTotal,
          // showTotal:  (total: number, range: [number,number]) => {return `${range[0]}-${range[1]} of ${total} items`}
          responsive: true,
          defaultPageSize: DefaultPageSize,
        }}
        renderItem={(i,num) => {
          const diskHavMovie = i.record_c>0 // 本地磁盘上有此影片
          return (
            <List.Item
              key={i.serial}
              className={diskHavMovie ? styles.havMovieRecord : styles.noMovieRecord }
            >
              <div className={styles.MovieList1}>
                <Typography.Title level={4}>{i.serial}</Typography.Title>
                <Button size='small' type={diskHavMovie? 'ghost' : 'primary'}
                  onClick={()=>{
                    setFuzzySearch(i.serial.replaceAll('-', " ")) // 传递给模糊查询的框体
                    if (showFuzzySearchBox>0) { // 如果窗体开着
                      window.clearTimeout(showFuzzySearchBox) // 取消延迟关闭
                    }
                    // 设置延迟关闭
                    let cancel = window.setTimeout(()=>{
                      setVisiableFuzzySearch(-1)
                    }, 3000)
                    setVisiableFuzzySearch(cancel)

                  }}
                >本地文件模糊查番号</Button>
                <img className={styles.MovieListImg} src={`myfile:///cache/javbus_pic_cache/${i.cover}`}></img>
              </div>
              <div>
                <Button onClick={()=>{setShowPic(true);setShowPicList(i.sample_pic);console.log(i.sample_pic)}}>show《{i.sample_pic.length}》sample pic</Button> 
                <div className={styles.idolNameList}>
                  {i.idol.map((idol)=><span key={idol.name}>{idol.name}</span>)}
                </div>
              </div>
              { diskHavMovie ? (<div className={styles.goMovieBtnList}>
                {i.disk_records.map((rr, index)=>{
                  return (
                    <Tooltip placement="left" title={`${rr.filePath} size:${rr.fileSize}`} key={rr.filePath+index}>
                      <Button size="small" onClick={() => {
                        electron.shell.openPath(rr.fileName)
                      }}>
                        <PlaySquareOutlined />{rr.filePath}
                      </Button>
                    </Tooltip>
                    )
                })}
              </div>) : 
              (<div style={{display: 'flex'}}>
                <div className={styles.magnetList}>
                  {i.magnet.map((magnet)=>{
                    let filename_s = magnet.magnet_link.lastIndexOf("dn=")
                    let filename = magnet.magnet_link.slice(filename_s+3)
                    filename = window.decodeURIComponent(filename)
                    return (
                      <Button key={magnet.magnet_link} size="small"
                        onClick={()=>{
                          navigator.clipboard.writeText(magnet.magnet_link)
                          message.info('磁链已经复制');
                        }}
                      ><CloudDownloadOutlined />{`${magnet.size} ${magnet.date} ${filename} `}</Button>
                    )
                  })}
                </div>
                {i.downloadPCstartDate ? 
                  <div className={styles.inDownloadListText}>已经进入下载队列 {moment(i.downloadPCstartDate).format('LLL')}</div> :
                  <Button onClick={()=>{
                    setJavbusMovieDownloading(i._id)
                      .then(()=>{
                        message.success('加入成功')
                        i.downloadPCstartDate = Date.now()
                        let refreshArray = [...movieList]
                        setMovieList(refreshArray)
                      })
                      .catch((err)=>{message.error('加入失败'+JSON.stringify(err))})
                  }}>加入下载机队列</Button>
                }
              </div>)}
            </List.Item>
          )
        }}
      />
  }
  
  return (
    <div>
      <FuzzySearchFileCard fuzzySearchStr={fuzzySearchStr} className={showFuzzySearchBox>0 ? "FuzzySearchFileCardClassName" : "noFuzzySearchFileCardClassName"}/>
      <Card  title={"Query Idol javbus Movies By page: " + props.idolDetail?.name} style={{margin: '10px 0 10px 0'}}>
        {List_Content}
      </Card>
      <Modal 
        title="Basic Modal" 
        visible={isShowMoviePicOpen} width={"90%"}
        footer={null} 
        onCancel={()=>{setShowPic(false)}}
      >
        <div className={styles.MovieSampleCont}>
          {showMoviePicList.map((i,index)=>{
            return (
              <div key={i.name} className={styles.MovieSampleItem} onMouseEnter={()=>{sliderRef.current.goTo(index, false)}}>
                <img className={styles.MovieSamplePic} src={`myfile:///cache/javbus_pic_cache/${i.name}`} />
              </div>
              )
          })}
        </div>
        <Button onClick={()=>{sliderRef.current.prev()}}>go prev</Button>
        <Button onClick={()=>{sliderRef.current.next()}}>go next</Button>
        <Carousel
          ref={sliderRef}
        >
          {showMoviePicList.map((i)=>{
            return (
              <div className={styles.slideItem} key={i.name}>
                <img style={{height: "50vh"}} src={`myfile:///cache/javbus_pic_cache/${i.name}`} />
              </div>
              )
          })}
        </Carousel>
      </Modal>
    </div>
  )
}
export default connect((state: ConnectState) => ({ ...state }))(IdolMovieQuery);
