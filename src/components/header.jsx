// import { Box } from "@mui/material";
// import AppBar from "@mui/material/AppBar";
// import { ipcRenderer } from "electron";
// import { Fragment, useState } from "react";

// function Header({
//     pkg: [activePkg, setPkg],
//     expGroup: [activeExpGroup, setExpGroup],
//     exp: [activeExp, setExp]
// }) {
//     const groups = (activePkg?.exports || []).reduce(function (acc, exp) {
//         const container = acc[exp.type] = acc[exp.type] || [];

//         container.push(exp);

//         return acc;
//     }, {});

//     const groupKeys = Object.keys(groups), groupCount = groupKeys.length;
//     const expCount = activeExpGroup !== "" ? groups[activeExpGroup].length : 0;

//     function onGroupChanged({ target: { value } }) {
//         setExpGroup(value);
//         setExp("");
//     }

//     function onExportChanged({ target: { value } }) {
//         ipcRenderer.send("user-interaction", {
//             type: "load-export",
//             payload: parseInt(value)
//         });

//         setExp(value);
//     }

//     return (
//         <Box sx={{ flexGrow: 1 }}>
//             <AppBar position="static"></AppBar>
//         </Box>
//     );

//     // return (
//     //     <div className="header">
//     //         <div>{activePkg?.filename || "No file"}</div>
//     //         <div className="dropdown-container">
//     //             <select value={activeExpGroup} disabled={groupCount === 0} onChange={onGroupChanged}>
//     //                 <option disabled={true} value="">-Nothing selected-</option>
//     //                 {
//     //                     groupKeys.map((gr, i) => (<option key={`group-dd-${i}`} value={gr}>{gr}</option>))
//     //                 }
//     //             </select>
//     //         </div>
//     //         <div className="dropdown-container">
//     //             <select value={activeExp} disabled={expCount === 0} onChange={onExportChanged}>
//     //                 <option disabled={true} value="">-Nothing selected-</option>
//     //                 {
//     //                     activeExpGroup === ""
//     //                         ? null
//     //                         : groups[activeExpGroup]
//     //                             .map((exp, i) => (
//     //                                 <option
//     //                                     key={`exp-dd-${i}`}
//     //                                     value={exp.index}
//     //                                 >{exp.name}</option>)
//     //                             )
//     //                 }
//     //             </select>
//     //         </div>
//     //         <input type="button" value="Open File" onClick={() => ipcRenderer.send("user-interaction", {
//     //             type: "read-package",
//     //             payload: { package: "17_25", type: "Level" }
//     //         })}></input>
//     //         <input type="button" value="Save File" onClick={() => ipcRenderer.send("user-interaction", {
//     //             type: "export-package"
//     //         })}></input>
//     //     </div>
//     // );
// }

// export default Header;
// export { Header };

import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

export default function SearchAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            MUI
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
        </Toolbar>
      </AppBar>
    </Box>
  );
}