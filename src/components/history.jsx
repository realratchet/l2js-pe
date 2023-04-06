import styled from "@emotion/styled";
import ClassIcon from "@mui/icons-material/Class";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
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


function History({ history: [history,] }) {
    let breadcrumbs;

    if (history.length === 0) {
        breadcrumbs = ([
            <StyledBreadcrumb
                component="a"
                href="#"
                label={"No package selected"}
                icon={<InventoryIcon fontSize="small" />}
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
                            icon={<ClassIcon fontSize="small" />}
                        />
                    );
            }
        });
    }

    return (
        <Breadcrumbs maxItems={7}
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
        >
            {breadcrumbs}
        </Breadcrumbs>
    );
}

export default History;
export { History };