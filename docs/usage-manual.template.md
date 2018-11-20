!MENU_ORDER 2
!INLINE ./header.md --hide-source-path
!MENU
&nbsp;

# Usage Manual


## Custom API vs Generic API


## Tailored Aproach

In our example todo app we implement a tailored API:

~~~js
!INLINE ../example/api/view-endpoints
~~~
~~~js
!INLINE ../example/api/mutation-endpoints
~~~

Instead of tailored endpoints, we could
create generic endpoints, such as:

~~~js
!INLINE ../example/api/generic-view-endpoints
~~~

But we deliberately choose a tailored API over a generic API.
