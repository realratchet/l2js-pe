import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import FolderIcon from "@mui/icons-material/Folder";
import SaveIcon from "@mui/icons-material/Save";
import IPCClient from "../../electron-app/events/ipc-client";

const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(1),
        width: "auto",
    },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    "& .MuiInputBase-input": {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            width: "12ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
}));

const StyledLink = styled("a")(() => ({
    color: "inherit",
    textDecoration: "underline",
    cursor: "pointer"
}));

function Header({ filter: [filter, setFilter], history: [history,] }) {

    function onSearch({ target: { value } }) { setFilter(value); }

    const [anchorEl, setAnchorEl] = useState(null);
    const open = !!anchorEl;

    function handleClickListItem(event) { setAnchorEl(event.currentTarget); }
    function handleClose() { setAnchorEl(null); }

    function onLoadDirectory() { console.log("onLoadDirectory"); }
    async function onSaveChanges() {
        let lastHistory = history[history.length - 1];
        let path = null;

        switch (lastHistory.type) {
            case "package": path = lastHistory.value.filename; break;
            case "object": path = lastHistory.value.filename; break;
            case "struct":
                while (lastHistory.parent) lastHistory = lastHistory.parent;
                path = lastHistory.filename;
                break;
            default: throw new Error(`Invalid history type: ${lastHistory.type}`);
        }


        await IPCClient.send("user-interaction", {
            type: "save-package",
            payload: {
                path
            }
        });

        // debugger;
    }

    const menuItems = [
        { label: "Load directory", enabled: false, callback: onLoadDirectory, icon: FolderIcon },
        { label: "Save changes", enabled: history.length > 0, callback: onSaveChanges, icon: SaveIcon }
    ];

    return (
        <Box sx={{ /*flexGrow: 1*/ }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={{ mr: 2 }}
                        onClick={handleClickListItem}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        open={open}
                        anchorEl={anchorEl}
                        MenuListProps={{ role: "listbox" }}
                        onClose={handleClose}
                    >
                        {
                            menuItems.map(({ label, enabled, callback, icon: Icon }, index) => {
                                return (
                                    <MenuItem key={index} disabled={!enabled} onClick={() => {
                                        setAnchorEl(null);
                                        callback();
                                    }}>
                                        {
                                            Icon
                                                ? (
                                                    <ListItemIcon>
                                                        <Icon fontSize="small"></Icon>
                                                    </ListItemIcon>
                                                )
                                                : null
                                        }
                                        {label}
                                    </MenuItem>
                                );
                            })
                        }
                    </Menu>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
                    >
                        <StyledLink onClick={() => require("electron").shell.openExternal("https://github.com/realratchet/Lineage2JS")}>Lineage2JS - Property Editor</StyledLink>
                    </Typography>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search…"
                            onChange={onSearch}
                            value={filter}
                            inputProps={{ "aria-label": "search" }}
                        />
                    </Search>
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
export { Header };