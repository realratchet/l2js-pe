import styled from "@emotion/styled";
import ClassIcon from "@mui/icons-material/Class";
import StartIcon from "@mui/icons-material/Start";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Breadcrumbs, Chip, emphasize, Typography } from "@mui/material";


const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor =
        theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[800];
    return {
        backgroundColor,
        height: theme.spacing(3),
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightRegular,
        "&:hover, &:focus": {
            backgroundColor: emphasize(backgroundColor, 0.06),
        },
        "&:active": {
            boxShadow: theme.shadows[1],
            backgroundColor: emphasize(backgroundColor, 0.12),
        },
    };
}); // TypeScript only: need a type cast here because https://github.com/Microsoft/TypeScript/issues/26591


function History({ history: [history, setHistory] }) {
    let breadcrumbs;

    function goBackToHistory(index) {
        if (history.length === index + 1)
            return;

        setHistory(history.slice(0, index + 1));
    }

    if (history.length === 0) {
        breadcrumbs = ([
            <StyledBreadcrumb
                key={-1}
                component="a"
                href="#"
                label="Packages"
                icon={<StartIcon fontSize="small" />}
            />
        ]);
    } else {
        breadcrumbs = history.map(({ type, name = "undefined" }, index, array) => {
            switch (type) {
                case "package":
                    return (
                        <StyledBreadcrumb
                            key={index}
                            component="a"
                            href="#"
                            label={name}
                            onClick={() => goBackToHistory(index)}
                            icon={<InventoryIcon fontSize="small" />}
                        />
                    );
                case "object":
                    if (array.length === index + 1) {
                        return <Typography
                            key={index}
                            color="text.primary">{name}</Typography>;
                    }

                    return (
                        <StyledBreadcrumb
                            key={index}
                            component="a"
                            href="#"
                            label={name}
                            onClick={() => goBackToHistory(index)}
                            icon={<ClassIcon fontSize="small" />}
                        />
                    );
                case "struct":
                    if (array.length === index + 1) {
                        return <Typography
                            key={index}
                            color="text.primary">{name}</Typography>;
                    }

                    return (
                        <StyledBreadcrumb
                            key={index}
                            component="a"
                            href="#"
                            label={name}
                            onClick={() => goBackToHistory(index)}
                            icon={<AccountTreeIcon fontSize="small" />}
                        />
                    );
                default:
                    return (
                        <StyledBreadcrumb
                            key={index}
                            component="a"
                            href="#"
                            label={`Unsupported breadcrub type '${type}'`}
                            icon={<QuestionMarkIcon fontSize="small" />}
                        />
                    );
            }
        });

        breadcrumbs.unshift(
            <StyledBreadcrumb
                key={-1}
                component="a"
                href="#"
                label="Packages"
                onClick={() => goBackToHistory(-1)}
                icon={<StartIcon fontSize="small" />}
            />
        );
    }

    return (
        <Breadcrumbs maxItems={7}
            separator={<NavigateNextIcon fontSize="small" />}
            style={{ padding: "16px" }}
        >
            {breadcrumbs}
        </Breadcrumbs>
    );
}

export default History;
export { History };