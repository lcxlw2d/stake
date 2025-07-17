import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { ConnectButton } from '@rainbow-me/rainbowkit';

// 定义Props（如果需要传递元素，可以扩展此接口）
interface NavbarProps {
  title?: string
}
// 导航元素类型
interface NavItem {
  label: string
  path: string
}

// 导航数组
const navItems: NavItem[] = [
  { label: '首页', path: '/' },
  { label: '账户信息', path: '/basicInfo' },
  { label: '合约', path: '/useContract' },

]

const Navbar: React.FC<NavbarProps> = ({ title = "My DApp" }) => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        {/* 使用Box容器，flex布局将所有元素靠右 */}
        <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between' }}>
          {/* 可以放各种元素，比如按钮、文本 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ mr: 2 }}>
              {title}
            </Typography>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                href={item.path}
                sx={{ ml: 2 }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <ConnectButton />

        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
