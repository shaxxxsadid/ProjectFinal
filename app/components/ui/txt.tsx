import { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";
interface TXTProps extends Omit<HTMLMotionProps<"span">, "children">{
    children: React.ReactNode,
    className?: string,
}

export default function TXT (props: TXTProps) {
    const {children, className, ...restMotionProps} = props;

    return <motion.span className={className ? className : ''} {...restMotionProps}>{children}</motion.span>
}