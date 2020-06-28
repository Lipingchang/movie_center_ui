import React from 'react';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Button, Card, Form, Input, List, message, Typography } from 'antd';
import { FormInstance } from 'antd/lib/form/Form';
import { pickOutFilesOneLevel, pickOutMoives } from '@/models/DiskScanUtils';
import { ScreenShot, loadBase64ImageFiles, CutPrefix } from '@/utils/FFmpeg';
import electron from 'electron';
import SuffixPicker, { movieSuffixList } from '@/components/SuffixPicker';
import PrefixSelect from './PrefixSelect';
import { PresistClassStateType, PresistClass } from '@/utils/presist';

const dialog: typeof electron.remote.dialog = window.require('electron').remote.dialog;

type MovieItem = {
  imagePath: string; //disk image path
  image: string; //base64 image
  moviePath: string; // disk moviePath
  cutLength: number; // seconds
  imageId: number; // index number in indexDB
};

type PropsType = {} & ConnectState;
type StateType = {
  movieItems: Array<MovieItem>;
  db: IDBDatabase;
  imageCache: any; // 存从 indexDB 拿出来的照片
} & PresistClassStateType;
class PrefixCutter extends PresistClass {
  formRef = React.createRef<FormInstance>();
  storage: any;
  readonly state: StateType = {
    movieItems: [],
    storageKey: 'PrefixCutter',
    db: null,
    imageCache: {},
  };
  constructor(props: PropsType) {
    super(props);
    this.storage = this.loadStateFromCache();
    this.state = {
      ...this.state,
      ...this.extractValues(this.storage, this.state),
    };
    this.connectDB()
      .then((db: IDBDatabase) => {
        this.setState({
          db,
        });
        message.success('indexdb connect');
      })
      .catch(() => {
        message.error('indexdb lost');
      });
  }

  componentDidMount() {
    const schema = this.formRef.current?.getFieldsValue();
    this.formRef.current?.setFieldsValue({
      ...this.extractValues(this.storage, schema),
    });
  }

  // 去除/添加 不缓存的内容
  componentWillUnmount() {
    this.saveStateToCache({ ...this.formRef.current?.getFieldsValue(), imageCache: {}, db: {} });
  }

  // 调用文件管理器 选择一个文件夹
  chooseFolder = () => {
    dialog
      .showOpenDialog({
        defaultPath: 'E:/',
        properties: ['openDirectory'],
      })
      .then(({ canceled, filePaths }) => {
        if (canceled) {
          return;
        }
        this.formRef.current.setFieldsValue({
          rootPath: filePaths[0],
        });
      });
  };

  // 从文件中load文件列表
  loadFiles = (force = false) => {
    const { rootPath, suffixList } = this.formRef.current.getFieldsValue();
    // 筛选种类 遍历单层文件
    const files = pickOutMoives(pickOutFilesOneLevel(rootPath), suffixList);
    console.log(files);
    // 存储 电影和缩略图和裁剪时间信息
    const movieItems: Array<MovieItem> = [];

    new Promise((resolve, reject) => {
      // 用Promise等待全部ffmpeg执行完成
      let count = 0;
      files.map((filePath, index) => {
        ScreenShot(filePath, 2, force)
          .then((res: string) => {
            movieItems.push({
              imagePath: res,
              image: '',
              moviePath: filePath,
              cutLength: 0,
            });
          })
          .catch((err) => {
            console.error(filePath, err);
          })
          .finally(() => {
            // 全部完成判断
            count += 1;
            if (count == files.length) {
              resolve();
            }
          });
      });
    })
      .then(() => {
        console.log('movieItems:', movieItems);
        // 载入磁盘上的图片
        return loadBase64ImageFiles(movieItems.map((item) => item.imagePath));
      })
      .then((images) => {
        const that = this;
        // 把图片保存到数据库中
        async function loop() {
          const imageCache = {}; // 同时缓存入内存
          for (let i = 0; i < images.length; i++) {
            const res = await that.savePicToIndexDB(images[i]);
            movieItems[i].imageId = res.target.result;
            imageCache[res.target.result] = images[i];
          }
          that.setState({
            movieItems: movieItems,
            imageCache: imageCache,
          });
          return Promise.resolve();
        }
        return loop();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // 过滤出 cutLength不为0的电影
  filterMovies = () => {
    const cutMovieItems = this.state.movieItems.filter((item) => item.cutLength !== 0);
    // TODO 耗时操作保存操作中间变量
    console.log(cutMovieItems);
    async function pLoop() {
      for (let i = 0; i < cutMovieItems.length; i++) {
        await CutPrefix(cutMovieItems[i].moviePath, cutMovieItems[i].cutLength);
      }
    }
    pLoop();
  };

  // 载入想要剪辑到的位置 的图片
  previewCut = () => {
    const movieItems = this.state.movieItems;
    console.log(movieItems);
    new Promise((resolve, reject) => {
      let i = 0;
      for (let item of movieItems) {
        if (item.cutLength === 0) {
          i++;
          if (i === movieItems.length) {
            resolve();
          }
          continue;
        }
        ScreenShot(item.moviePath, item.cutLength === 0 ? 2 : item.cutLength, true)
          .then((res) => {
            item.imagePath = res;
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            i++;
            if (i === movieItems.length) {
              resolve();
            }
          });
      }
    })
      .then(() => {
        console.log('movieItems:', movieItems);
        // 载入磁盘上的图片
        return loadBase64ImageFiles(movieItems.map((item) => item.imagePath));
      })
      .then((images) => {
        // 把图片放到img中
        console.log(images);
        for (let i = 0; i < movieItems.length; i++) {
          movieItems[i].image = images[i];
        }
        this.setState({
          movieItems: movieItems,
        });
        // setMovieItems(movieItems);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  render() {
    const movieItems = this.state.movieItems;
    return (
      <>
        <PageHeaderWrapper>
          <Card>
            <Form ref={this.formRef}>
              <Form.Item
                label="后缀列表"
                name="suffixList"
                rules={[{ required: true }]}
                initialValue={movieSuffixList}
              >
                <SuffixPicker />
              </Form.Item>
              <Form.Item
                label="根文件夹"
                name="rootPath"
                rules={[{ required: true, whitespace: true }]}
              >
                <Input />
              </Form.Item>
              <Button
                onClick={() => {
                  this.chooseFolder();
                }}
              >
                choose folder
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  this.loadFiles();
                }}
              >
                load files from disk
              </Button>
              <Button
                danger
                onClick={() => {
                  this.loadFiles(true);
                }}
              >
                Force load files from disk(will do ffmpeg proc)
              </Button>
              <Button
                onClick={() => {
                  this.loadPicToMemory()?.then((res) =>
                    this.setState({
                      imageCache: res,
                    }),
                  );
                }}
              >
                load Pic(from db)
              </Button>
            </Form>

            <List
              itemLayout="horizontal"
              size="large"
              dataSource={movieItems}
              renderItem={(item, itemIndex) => (
                <List.Item
                  key={item.imagePath}
                  extra={
                    <img
                      style={{ maxWidth: '20%' }}
                      alt={item.imagePath}
                      src={`data:image/png;base64,${
                        this.state.imageCache[item.imageId] || item.image
                      }`}
                    />
                  }
                >
                  <Typography
                    style={{
                      textOverflow: 'ellipsis',
                      width: '40%',
                      minWidth: '100px',
                      overflow: 'hidden',
                    }}
                  >
                    <Typography.Paragraph>{item.moviePath}</Typography.Paragraph>
                    <Typography.Paragraph>{item.imagePath}</Typography.Paragraph>
                  </Typography>
                  <PrefixSelect
                    value={item.cutLength}
                    onChange={(e) => {
                      item.cutLength = e.target.value;
                      movieItems[itemIndex] = {
                        ...item,
                      };
                      this.setState({
                        movieItems: [...movieItems],
                      });
                    }}
                  />
                </List.Item>
              )}
            />
          </Card>
          <Card title="cut">
            {/* <Button onClick={this.filterMovies}>filter need cut movies</Button> */}
            <Button onClick={this.previewCut}>preview Cut</Button>
          </Card>
        </PageHeaderWrapper>
      </>
    );
  }

  // 连接到indexdb
  TABLE_NAME = 'tb_prefixcutter';
  connectDB = (): Promise<any> => {
    const that = this;
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('picCache', 3);
      //  初始化表
      request.onupgradeneeded = function (event) {
        const db: IDBDatabase = event.target.result;
        if (!db.objectStoreNames.contains(that.TABLE_NAME)) {
          // 主键id, 自动递增
          const objectStore = db.createObjectStore(that.TABLE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          // objectStore.createIndex
        }
        if (!db.objectStoreNames.contains(that.MOVIEITEMS_TABLE_NAME)) {
          db.createObjectStore(that.MOVIEITEMS_TABLE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = function (evnet) {
        const db: IDBDatabase = event?.target.result;
        resolve(db);
      };

      request.onerror = function (evnet) {
        reject(evnet);
      };
    });
  };

  // 把缩略图保存到 浏览器的数据库中, 返回数据库id
  // TODO 计算hash 防止重复保存
  savePicToIndexDB = (pic: any) => {
    const db = this.state.db;
    if (!this.state.db) {
      return Promise.reject('db not init!');
    }
    return new Promise((resolve, reject) => {
      const re = db
        .transaction([this.TABLE_NAME], 'readwrite')
        .objectStore(this.TABLE_NAME)
        .add({ pic });
      re.onsuccess = function (e) {
        resolve(e);
      };
      re.onerror = function (e) {
        reject(e);
      };
    });
  };

  // 从数据库 中 一次性 取出 movieItems列表中 的图片
  loadPicToMemory = (): Promise<any> => {
    if (this.state.movieItems.length <= 0) {
      return Promise.reject('列表为空');
    }
    return new Promise((resolve, reject) => {
      const images = {};
      let max = this.state.movieItems[0].imageId;
      let min = this.state.movieItems[0].imageId;
      this.state.movieItems.forEach((item) => {
        max = item.imageId > max ? item.imageId : max;
        min = item.imageId < min ? item.imageId : min;
      });
      if (max === undefined || min === undefined) {
        reject('这个列表 没有被保存过');
      }
      const trans = this.state.db.transaction([this.TABLE_NAME], 'readonly');
      const objstore = trans.objectStore(this.TABLE_NAME);
      const req = objstore.openCursor(IDBKeyRange.bound(min, max));
      req.onerror = function (event) {
        console.error(event);
        reject('indexdb 查询出错');
      };
      req.onsuccess = function (event) {
        const cursor: IDBCursor = event.target.result;
        if (cursor) {
          // console.log(cursor.value);
          images[cursor.value['id']] = cursor.value['pic'];
          cursor.continue();
        } else {
          resolve(images);
        }
      };
    });
  };

  MOVIEITEMS_TABLE_NAME = 'tb_prefixcutter_movieItems';
  saveMovieItemsToIndexDB = () => {
    const db = this.state.db;
    const that = this;
    if (!this.state.db) {
      return Promise.reject('db not init!');
    }
    return new Promise((resolve, reject) => {
      const re = db
        .transaction([this.MOVIEITEMS_TABLE_NAME], 'readwrite')
        .objectStore(this.MOVIEITEMS_TABLE_NAME)
        .add({ data: this.state.movieItems });
      re.onsuccess = function (e) {
        resolve(e);
      };
      re.onerror = function (e) {
        reject(e);
      };
    });
  };
}

// export default connect((state: ConnectState) => ({ ...state }))(PrefixCutter);
export default PrefixCutter;
