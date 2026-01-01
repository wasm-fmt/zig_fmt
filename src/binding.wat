;; Wrapper module for multivalue returns
;; Calls zig_fmt's format_impl (returns i64) and unpacks it to (i32, i32)

(module
	;; Import from zig_fmt module
	(import "zig_fmt" "format_impl" (func $format_impl (param i32 i32) (result i64)))

	;; Export multivalue format function
	(func (export "format") (param i32 i32) (result i32 i32)
		(local i64)
		local.get 0        ;; input_ptr
		local.get 1        ;; input_len
		call $format_impl  ;; call zig_fmt, get i64 result
		local.tee 2        ;; save i64 to local 2
		i64.const 32
		i64.shr_u          ;; shift right 32 bits -> ptr
		i32.wrap_i64
		local.get 2        ;; get i64 again
		i32.wrap_i64       ;; wrap low 32 bits -> len
	)
)
