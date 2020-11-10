import React, { useEffect } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Typography, Alert, Avatar, Button } from 'antd';
import styles from './Welcome.less';
import PupeteerStart from '@/components/Pupeteer'


// console.log(fs)

const CodePreview: React.FC<{}> = ({ children }) => (
  <pre className={styles.pre}>
    <code>
      <Typography.Text copyable>{children}</Typography.Text>
    </code>
  </pre>
);

export default (): React.ReactNode => {
  return (
    <PageHeaderWrapper>

      <Card title="">

      </Card>
      <Card>
        <Alert
          message="umi ui 现已发布，点击右下角 umi 图标即可使用"
          type="success"
          showIcon
          banner
          style={{
            margin: -12,
            marginBottom: 24,
          }}
        />
        <Typography.Text strong>
          <a target="_blank" rel="noopener noreferrer" href="https://pro.ant.design/docs/block">
            基于 block 开发，快速构建标准页面
          </a>
        </Typography.Text>
        <CodePreview> npm run ui</CodePreview>
        <Typography.Text
          strong
          style={{
            marginBottom: 12,
          }}
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://pro.ant.design/docs/available-script#npm-run-fetchblocks"
          >
            获取全部区块
          </a>
        </Typography.Text>
        <CodePreview> npm run fetch:blocks</CodePreview>

        <p>使用local的file作为图片</p>
        <p>https://www.electronjs.org/docs/api/protocol</p>
        <Avatar src="myfile:///cache\e8abc280ae9f46538e920f438428b5c7!400x400.jpg"></Avatar>
        <Avatar src="myfile:///cache/e8abc280ae9f46538e920f438428b5c7!400x400.jpg"></Avatar>
      </Card>
      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
        }}
      >
        Want to add more pages? Please refer to{' '}
        <a href="https://pro.ant.design/docs/block-cn" target="_blank" rel="noopener noreferrer">
          use block
        </a>
        。
      </p>
      <PupeteerStart/>
    </PageHeaderWrapper>
  );
};
