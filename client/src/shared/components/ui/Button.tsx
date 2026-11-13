import { Button, type ButtonProps } from "@heroui/react";
const CustomButton = (props: ButtonProps) => 
{
  return <Button 
    className="bg-[#a46023] text-white"
    {...props} 
    
  />
}
export default CustomButton;