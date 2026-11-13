import { SearchField, type SearchFieldProps } from "@heroui/react";
const CustomSearchField = (props: any) => {
  const { placeholder, inputClassName = "w-70", ...rest } = props;
  return <SearchField name="search" {...rest}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input className={inputClassName} placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField >
}
export default CustomSearchField;